import { ElMessage } from "element-plus";
import {
	createRouter,
	createRouterMatcher,
	createWebHashHistory,
	createWebHistory,
	type RouteRecordRaw,
} from "vue-router";
import { isArray } from "lodash-es";
import { type Router, module, storage } from "/@/cool";
import { config, isDev } from "/@/config";
import { useBase } from "/$/base";
import { Loading } from "../utils";

const baseUrl = import.meta.env.BASE_URL;

const files = import.meta.glob([
	"/src/modules/*/{views,pages}/**/*",
	"!**/components",
]);

const routes: RouteRecordRaw[] = [
	{
		path: "/",
		name: "index",
		component: () => import("/$/base/pages/main/index.vue"),
		children: [
			{
				path: "company/business",
				name: "company-business",
				component: () => import("/$/company/views/business.vue"),
				meta: {
					keepAlive: true,
					label: "Sales",
				},
			},
			{
				path: "company/business/delivery",
				name: "company-business-delivery",
				component: () => import("/$/company/views/business/delivery.vue"),
				meta: {
					keepAlive: true,
					label: "Delivery",
				},
			},
			{
				path: "company/business/quote",
				name: "company-business-quote",
				component: () => import("/$/company/views/business/quote.vue"),
				meta: {
					keepAlive: true,
					label: "Quote",
				},
			},
			{
				path: "company/business/contract",
				name: "company-business-contract",
				component: () => import("/$/company/views/business/contract.vue"),
				meta: {
					keepAlive: true,
					label: "Contract",
				},
			},
			{
				path: "company/business/invoice",
				name: "company-business-invoice",
				component: () => import("/$/company/views/business/invoice.vue"),
				meta: {
					keepAlive: true,
					label: "Invoice",
				},
			},
			{
				path: "company/key-person",
				name: "company-key-person",
				component: () => import("/$/company/views/key-person.vue"),
				meta: {
					keepAlive: true,
					label: "\u5ba2\u6237\u7ba1\u7406-\u5173\u952e\u4eba",
				},
			},
			{
				path: "company/lead/pool",
				name: "company-lead-pool",
				component: () => import("/$/company/views/lead/pool.vue"),
				meta: {
					keepAlive: true,
					label: "Lead Pool",
				},
			},
		],
	},
	{
		path: "/:catchAll(.*)",
		name: "404",
		component: () => import("/$/base/pages/error/404.vue"),
	},
];

const router = createRouter({
	history:
		config.app.router.mode == "history"
			? createWebHistory(baseUrl)
			: createWebHashHistory(baseUrl),
	routes,
}) as Router;

router.beforeResolve(() => {
	Loading.close();
});

let lock = false;

router.onError((error: Error) => {
	if (!lock) {
		lock = true;

		ElMessage.error(`Page error: ${error.message}`);
		console.error(error);

		if (error.message?.includes("Failed to fetch dynamically imported module")) {
			if (!isDev) {
				window.location.reload();
			}
		}

		setTimeout(() => {
			lock = false;
		}, 0);
	}
});

router.append = function (routeData) {
	if (!routeData) {
		return false;
	}

	const routeList = isArray(routeData) ? routeData : [routeData];

	routeList.forEach(route => {
		if (!route.meta) {
			route.meta = {};
		}

		if (!route.component) {
			const viewPath = route.viewPath;

			if (viewPath) {
				if (viewPath.startsWith("http")) {
					route.meta.iframeUrl = viewPath;
					route.component = () => import("/$/base/views/frame.vue");
				} else {
					route.component = files["/src/" + viewPath.replace("cool/", "")];
				}
			} else if (!route.redirect) {
				route.redirect = "/404";
			}
		}

		route.props = true;
		route.meta.dynamic = true;

		if (route.isPage || route.viewPath?.includes("/pages/")) {
			router.addRoute(route);
		} else {
			router.addRoute("index", route);
		}
	});
};

router.del = function (routeName) {
	const allRoutes = router.getRoutes();

	allRoutes.forEach(route => {
		if (route.name === routeName) {
			router.removeRoute(routeName);
		}
	});
};

router.clear = function () {
	const allRoutes = router.getRoutes();

	allRoutes.forEach(route => {
		if (route.name && route.meta?.dynamic) {
			router.removeRoute(route.name);
		}
	});
};

router.find = function (path: string) {
	const { menu } = useBase();
	const registeredRoutes = router.getRoutes();

	const routeList: any[] = [
		...registeredRoutes.map(route => ({
			...route,
			isReg: true,
		})),
		...menu.routes,
		...module.list.flatMap(item => (item.views || []).concat(item.pages || [])),
	];

	let isRegistered = false;
	let matchedRoute: (typeof routeList)[number] | undefined;

	const matcher = createRouterMatcher(routeList, {});

	matcher.getRoutes().find(route => {
		const routeRegex = new RegExp(route.re);

		if (routeRegex.test(path)) {
			if (path === "/") {
				matchedRoute = routeList.find(item => item.meta?.isHome);
			} else {
				matchedRoute = routeList.find(
					item => item.path === route.record.path && item.name !== "index"
				);
			}

			if (matchedRoute) {
				isRegistered = !!matchedRoute.isReg;
			}

			return true;
		}

		return false;
	});

	return {
		route: matchedRoute,
		isReg: isRegistered,
	};
};

router.beforeEach(async (to, from, next) => {
	await Loading.wait();

	const { process, user } = useBase();
	const { isReg, route } = router.find(to.path);

	if (!route) {
		next(user.token ? "/404" : "/login");
		return;
	}

	if (!isReg) {
		router.append(route);
		next(to.fullPath);
		return;
	}

	if (user.token) {
		if (to.path.includes("/login")) {
			if (!storage.isExpired("token")) {
				next("/");
				return;
			}
		} else {
			process.add(to);
		}
	} else {
		user.clear();

		if (!config.ignore.token.some(ignorePath => to.path === ignorePath)) {
			next("/login");
			return;
		}
	}

	next();
});

export { router };
