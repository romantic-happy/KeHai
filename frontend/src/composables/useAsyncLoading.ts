/**
 * 独立加载按钮 Hook（每个按钮独立运行，互不干扰）
 * 适用于列表中多个按钮需要独立控制加载状态的场景
 *
 * 使用方式：
 * // 1. 定义加载状态映射
 * const loadingMap = useAsyncLoading();
 *
 * // 2. 模板中使用
 * <el-button :loading="loadingMap.isLoading('item-key')" @click="handleClick('item-key')">
 *
 * // 3. 脚本中调用
 * await loadingMap.runWithLoading('item-key', async () => {
 *   await api.call();
 * }, { successText: '操作成功' });
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

export interface UseAsyncLoadingReturn {
	/**
	 * 检查指定 key 的加载状态
	 */
	isLoading: (key: string) => boolean;

	/**
	 * 执行带加载状态的异步操作
	 * @param key 唯一标识符（如 item.id、cacheKey 等）
	 * @param asyncFn 任何异步函数
	 * @param options 配置选项
	 */
	runWithLoading: <T>(
		key: string,
		asyncFn: () => Promise<T>,
		options?: {
			loadingText?: string;
			successText?: string;
			errorText?: string;
			showSuccessMessage?: boolean;
			onSuccess?: (result: T) => void;
			onError?: (error: any) => void;
		}
	) => Promise<T | undefined>;

	/**
	 * 手动设置某个 key 的加载状态
	 */
	setLoading: (key: string, loading: boolean) => void;

	/**
	 * 清除某个 key 的加载状态
	 */
	clearLoading: (key: string) => void;

	/**
	 * 清除所有加载状态
	 */
	clearAll: () => void;
}

/**
 * 创建独立加载状态管理器
 */
export function useAsyncLoading(): UseAsyncLoadingReturn {
	// 使用 Map 存储每个 key 的加载状态
	const loadingMap = ref<Record<string, boolean>>({});

	/**
	 * 检查指定 key 的加载状态
	 */
	function isLoading(key: string): boolean {
		return loadingMap.value[key] === true;
	}

	/**
	 * 手动设置某个 key 的加载状态
	 */
	function setLoading(key: string, loading: boolean): void {
		loadingMap.value[key] = loading;
		// 强制触发响应式更新
		loadingMap.value = { ...loadingMap.value };
	}

	/**
	 * 清除某个 key 的加载状态
	 */
	function clearLoading(key: string): void {
		loadingMap.value[key] = false;
		// 强制触发响应式更新
		loadingMap.value = { ...loadingMap.value };
	}

	/**
	 * 清除所有加载状态
	 */
	function clearAll(): void {
		loadingMap.value = {};
	}

	/**
	 * 执行带加载状态的异步操作
	 */
	async function runWithLoading<T>(
		key: string,
		asyncFn: () => Promise<T>,
		options?: {
			loadingText?: string;
			successText?: string;
			errorText?: string;
			showSuccessMessage?: boolean;
			onSuccess?: (result: T) => void;
			onError?: (error: any) => void;
		}
	): Promise<T | undefined> {
		// 设置加载状态
		setLoading(key, true);

		// 显示加载提示
		const loadingText = options?.loadingText || '正在处理，请稍候...';
		const loadingMsg = ElMessage({
			type: 'info',
			message: loadingText,
			duration: 0,
			showClose: true
		});

		try {
			// 执行异步操作
			const result = await asyncFn();

			// 关闭加载提示
			loadingMsg.close();

			// 清除加载状态
			clearLoading(key);

			// 成功回调
			if (options?.onSuccess) {
				options.onSuccess(result);
			} else if (options?.showSuccessMessage !== false && options?.successText) {
				ElMessage.success(options.successText);
			}

			return result;
		} catch (error: any) {
			// 关闭加载提示
			loadingMsg.close();

			// 清除加载状态
			clearLoading(key);

			// 错误回调
		
			if (options?.onError) {
				options.onError(error);
			} else {
				ElMessage.error(options?.errorText || error?.message || '操作失败');
			}

			return undefined;
		}
	}

	return {
		isLoading,
		runWithLoading,
		setLoading,
		clearLoading,
		clearAll
	};
}
