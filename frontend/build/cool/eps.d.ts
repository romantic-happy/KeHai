declare namespace Eps {
	interface BaseSysDepartmentEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 部门名称
		 */
		name?: string;

		/**
		 * 创建者ID
		 */
		userId?: number;

		/**
		 * 上级部门ID
		 */
		parentId?: number;

		/**
		 * 排序
		 */
		orderNum?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysLogEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 用户ID
		 */
		userId?: number;

		/**
		 * 行为
		 */
		action?: string;

		/**
		 * ip
		 */
		ip?: string;

		/**
		 * 参数
		 */
		params?: any;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 姓名
		 */
		name?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysMenuEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 父菜单ID
		 */
		parentId?: number;

		/**
		 * 菜单名称
		 */
		name?: string;

		/**
		 * 菜单地址
		 */
		router?: string;

		/**
		 * 权限标识
		 */
		perms?: string;

		/**
		 * 类型 0-目录 1-菜单 2-按钮
		 */
		type?: number;

		/**
		 * 图标
		 */
		icon?: string;

		/**
		 * 排序
		 */
		orderNum?: number;

		/**
		 * 视图地址
		 */
		viewPath?: string;

		/**
		 * 路由缓存
		 */
		keepAlive?: boolean;

		/**
		 * 是否显示
		 */
		isShow?: boolean;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysParamEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 键
		 */
		keyName?: string;

		/**
		 * 名称
		 */
		name?: string;

		/**
		 * 数据
		 */
		data?: string;

		/**
		 * 数据类型 0-字符串 1-富文本 2-文件
		 */
		dataType?: number;

		/**
		 * 备注
		 */
		remark?: string;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysRoleEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 用户ID
		 */
		userId?: string;

		/**
		 * 名称
		 */
		name?: string;

		/**
		 * 角色标签
		 */
		label?: string;

		/**
		 * 备注
		 */
		remark?: string;

		/**
		 * 数据权限是否关联上下级
		 */
		relevance?: boolean;

		/**
		 * 菜单权限
		 */
		menuIdList?: any;

		/**
		 * 部门权限
		 */
		departmentIdList?: any;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface BaseSysUserEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 部门ID
		 */
		departmentId?: number;

		/**
		 * 创建者ID
		 */
		userId?: number;

		/**
		 * 姓名
		 */
		name?: string;

		/**
		 * 用户名
		 */
		username?: string;

		/**
		 * 密码
		 */
		password?: string;

		/**
		 * 密码版本, 作用是改完密码，让原来的token失效
		 */
		passwordV?: number;

		/**
		 * 昵称
		 */
		nickName?: string;

		/**
		 * 头像
		 */
		headImg?: string;

		/**
		 * 手机
		 */
		phone?: string;

		/**
		 * 邮箱
		 */
		email?: string;

		/**
		 * 备注
		 */
		remark?: string;

		/**
		 * 状态 0-禁用 1-启用
		 */
		status?: number;

		/**
		 * socketId
		 */
		socketId?: string;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanyContractMgmtEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 合同编号
		 */
		contractNo?: string;

		/**
		 * 合同名称
		 */
		contractName?: string;

		/**
		 * 合同类别
		 */
		contractCategory?: number;

		/**
		 * 客户ID
		 */
		customerId?: number;

		/**
		 * 客户名称
		 */
		customerName?: string;

		/**
		 * 合同金额
		 */
		contractAmount?: number;

		/**
		 * 合同状态
		 */
		contractStatus?: number;

		/**
		 * 合同详情
		 */
		contractDetails?: string;

		/**
		 * 合同开始日期
		 */
		startDate?: Date;

		/**
		 * 合同结束日期
		 */
		endDate?: Date;

		/**
		 * 签订日期
		 */
		signDate?: Date;

		/**
		 * 合同文件路径
		 */
		filePath?: string;

		/**
		 * 模板文件路径
		 */
		templatePath?: string;

		/**
		 * 备注
		 */
		remark?: string;

		/**
		 * 创建人ID
		 */
		createUserId?: number;

		/**
		 * 创建人姓名
		 */
		createUserName?: string;

		/**
		 * 是否删除
		 */
		isDeleted?: number;

		/**
		 * 合同变量数据（用于模板填充）
		 */
		templateVariables?: any;

		/**
		 * 版本号
		 */
		version?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanyCustomerEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 客户名称
		 */
		customerName?: string;

		/**
		 * 来源
		 */
		backgroundSource?: string;

		/**
		 * 线索
		 */
		clue?: string;

		/**
		 * 行业大分类
		 */
		industryCategoryMajor?: string;

		/**
		 * 行业小分类
		 */
		industryCategoryMinor?: string;

		/**
		 * 负责人
		 */
		backgroundOwner?: string;

		/**
		 * 协作人列表
		 */
		backgroundCollaboratorUserIds?: any;

		/**
		 * 客户关系
		 */
		level?: string;

		/**
		 * 合作阶段
		 */
		manageStatus?: string;

		/**
		 * 备注
		 */
		backgroundRemark?: string;

		/**
		 * 公司背景
		 */
		backgroundCompanyProfile?: string;

		/**
		 * 经营范围/企业经营项目
		 */
		businessScope?: string;

		/**
		 * 成立时间
		 */
		backgroundEstablishDate?: string;

		/**
		 * 注册资金
		 */
		backgroundRegisteredCapital?: string;

		/**
		 * 企业性质
		 */
		backgroundEnterpriseType?: string;

		/**
		 * 是否上市
		 */
		backgroundIsListed?: string;

		/**
		 * 详细地址
		 */
		address?: string;

		/**
		 * 当年营业额
		 */
		backgroundTurnoverCurrent?: string;

		/**
		 * 上一年营业额
		 */
		backgroundTurnoverLast?: string;

		/**
		 * 上上年营业额
		 */
		backgroundTurnoverPrev?: string;

		/**
		 * 年产值
		 */
		annualOutputValue?: string;

		/**
		 * 预算
		 */
		budget?: string;

		/**
		 * 上级客户
		 */
		backgroundSuperiorCustomer?: string;

		/**
		 * 下游客户
		 */
		backgroundDownstreamCustomer?: string;

		/**
		 * 机器人工艺
		 */
		backgroundRobot?: string;

		/**
		 * 公司网址
		 */
		backgroundWebsite?: string;

		/**
		 * 电话
		 */
		backgroundPhone?: string;

		/**
		 * 电子邮件
		 */
		backgroundEmail?: string;

		/**
		 * 国家
		 */
		backgroundCountry?: string;

		/**
		 * 省
		 */
		backgroundProvince?: string;

		/**
		 * 市
		 */
		backgroundCity?: string;

		/**
		 * 区
		 */
		backgroundDistrict?: string;

		/**
		 * 详细地址(扩展)
		 */
		backgroundAddressDetail?: string;

		/**
		 * 竞争对手
		 */
		competitors?: string;

		/**
		 * 关键人
		 */
		keyContacts?: any;

		/**
		 * AI 客户画像
		 */
		backgroundPortrait?: string;

		/**
		 * 客户编号
		 */
		customerNo?: string;

		/**
		 * 创建时间
		 */
		createTime?: Date;

		/**
		 * 更新时间
		 */
		updateTime?: Date;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanyFollowUpRecordEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 客户名称
		 */
		customerName?: string;

		/**
		 * 关键人
		 */
		keyPerson?: string;

		/**
		 * 跟进人
		 */
		ownerUserName?: string;

		/**
		 * 跟进方式
		 */
		method?: string;

		/**
		 * 跟进状态
		 */
		status?: string;

		/**
		 * 跟进结果
		 */
		result?: string;

		/**
		 * 跟进时间
		 */
		followUpTime?: Date;

		/**
		 * 下次跟进时间
		 */
		nextFollowTime?: Date;

		/**
		 * 日程提醒
		 */
		isReminder?: string;

		/**
		 * 跟进人所在部门
		 */
		followUpPersonDept?: string;

		/**
		 * 创建人
		 */
		creator?: string;

		/**
		 * 最后修改人
		 */
		modifier?: string;

		/**
		 * 核算维度
		 */
		accountingDimension?: string;

		/**
		 * 协作人
		 */
		collaborators?: string;

		/**
		 * 联系详情
		 */
		details?: string;

		/**
		 * AI销售指导
		 */
		aiGuide?: string;

		/**
		 * 创建时间
		 */
		createTime?: Date;

		/**
		 * 更新时间
		 */
		updateTime?: Date;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanyInquiryEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 询价单号
		 */
		inquiryNo?: string;

		/**
		 * 询价类型
		 */
		inquiryType?: number;

		/**
		 * 客户
		 */
		customer?: string;

		/**
		 * 协作人ID列表
		 */
		collaboratorUserIds?: any;

		/**
		 * 报价截止日期
		 */
		deadlineDate?: Date;

		/**
		 * 附件URL列表
		 */
		attachments?: any;

		/**
		 * 备注
		 */
		remark?: string;

		/**
		 * 产品明细
		 */
		productItems?: any;

		/**
		 * AI分类
		 */
		aiCategory?: string;

		/**
		 * AI分类分析
		 */
		aiCategoryAnalysis?: string;

		/**
		 * AI历史报价
		 */
		aiHistoryQuote?: string;

		/**
		 * AI历史报价依据
		 */
		aiHistoryQuoteBasis?: string;

		/**
		 * 报价业务状态
		 */
		quoteBizStatus?: number;

		/**
		 * 驳回原因
		 */
		rejectReason?: string;

		/**
		 * 销售报价
		 */
		salesQuote?: number;

		/**
		 * 销售报价备注
		 */
		salesQuoteRemark?: string;

		/**
		 * 销售报价时间
		 */
		salesQuoteTime?: Date;

		/**
		 * 是否成单
		 */
		dealStatus?: number;

		/**
		 * 丢单原因
		 */
		lostReason?: string;

		/**
		 * 合同订单号
		 */
		contractOrderNo?: string;

		/**
		 * 项目名称
		 */
		projectName?: string;

		/**
		 * 项目地点（省市县）
		 */
		projectLocation?: any;

		/**
		 * 具体地址
		 */
		address?: string;

		/**
		 * 项目工期开始
		 */
		projectStartDate?: Date;

		/**
		 * 项目工期结束
		 */
		projectEndDate?: Date;

		/**
		 * 设备品牌
		 */
		equipmentBrand?: string;

		/**
		 * 设备型号及数量
		 */
		equipmentModelQty?: string;

		/**
		 * 交付标准
		 */
		deliverStandard?: string;

		/**
		 * 售后要求
		 */
		afterSalesRequirement?: string;

		/**
		 * 备件明细
		 */
		sparePartsDetail?: string;

		/**
		 * 备件明细列表（多物料）
		 */
		spareItems?: any;

		/**
		 * 工具要求
		 */
		toolRequirement?: string;

		/**
		 * 软件要求
		 */
		softwareRequirement?: string;

		/**
		 * 吊装需求
		 */
		hoistingRequirement?: number;

		/**
		 * 能力需求
		 */
		capabilityRequirement?: string;

		/**
		 * 技工种及人数
		 */
		workerTypeAndCount?: string;

		/**
		 * 具体人员（内部人员/委外）
		 */
		specificPersonnel?: string;

		/**
		 * 初步施工方案
		 */
		initialConstructionPlan?: string;

		/**
		 * 创建人ID
		 */
		createUserId?: number;

		/**
		 * 负责人姓名（默认填写人）
		 */
		ownerName?: string;

		/**
		 * 最新报价ID
		 */
		quoteId?: number;

		/**
		 * 待重报标记 0-否 1-是
		 */
		requotePending?: number;

		/**
		 * 加工要求
		 */
		processingRequirement?: string;

		/**
		 * 图纸附件
		 */
		drawingAttachments?: any;

		/**
		 * 维修类型（支持自填）
		 */
		repairType?: string;

		/**
		 * 故障描述
		 */
		faultDescription?: string;

		/**
		 * 现场环境
		 */
		siteEnvironment?: number;

		/**
		 * 现场附件（图片/视频）
		 */
		siteAttachments?: any;

		/**
		 * 明确调试归属
		 */
		debugOwnership?: number;

		/**
		 * 保养类型
		 */
		maintenanceType?: number;

		/**
		 * 保养内容
		 */
		maintenanceContent?: string;

		/**
		 * 保养范围
		 */
		maintenanceScope?: string;

		/**
		 * 施工类型
		 */
		projectConstructType?: number;

		/**
		 * 施工内容
		 */
		projectConstructContent?: string;

		/**
		 * 施工内容附件（客户技术协议）
		 */
		projectConstructAttachments?: any;

		/**
		 * 现场环境描述
		 */
		projectSiteEnvDesc?: string;

		/**
		 * 现场环境附件（图片+视频）
		 */
		projectSiteEnvAttachments?: any;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 报价单号
		 */
		quoteNo?: string;

		/**
		 * 总成本
		 */
		quoteTotalCost?: number;

		/**
		 * 供应商
		 */
		quoteSupplier?: string;

		/**
		 * 未税报价
		 */
		quotePriceExclTax?: number;

		/**
		 * 税率（%）
		 */
		quoteTaxRate?: number;

		/**
		 * 含税报价
		 */
		quotePriceInclTax?: number;

		/**
		 * 是否已拒绝
		 */
		quoteIsRejected?: number;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanyInvoiceEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 开票单号
		 */
		invoiceNo?: string;

		/**
		 * 关联客户ID
		 */
		customerId?: number;

		/**
		 * 客户名称
		 */
		customerName?: string;

		/**
		 * 关联合同订单ID列表（company_contract_order.id）
		 */
		contractOrderIds?: any;

		/**
		 * 合同订单展示文本
		 */
		contractOrderLabels?: string;

		/**
		 * 预计回款日期
		 */
		expectedPaybackDate?: string;

		/**
		 * 开票金额
		 */
		invoiceAmount?: number;

		/**
		 * 开票类型 vat_special / vat_normal
		 */
		invoiceType?: string;

		/**
		 * 负责人用户ID
		 */
		ownerUserId?: number;

		/**
		 * 协作人用户ID列表
		 */
		collaboratorUserIds?: any;

		/**
		 * 备注
		 */
		remark?: string;

		/**
		 * 开票明细分项
		 */
		detailRows?: any;

		/**
		 * 税号
		 */
		taxNo?: string;

		/**
		 * 开户行名称
		 */
		bankName?: string;

		/**
		 * 开户账号
		 */
		bankAccount?: string;

		/**
		 * 开户行行号
		 */
		bankBranchCode?: string;

		/**
		 * 创建人ID
		 */
		createUserId?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanyLeadEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 线索编号
		 */
		leadNo?: string;

		/**
		 * 线索题目
		 */
		leadTitle?: string;

		/**
		 * 线索详情
		 */
		leadDetail?: string;

		/**
		 * 线索状态
		 */
		leadStatus?: number;

		/**
		 * 跟进详情
		 */
		followupDetail?: string;

		/**
		 * AI线索分析
		 */
		aiAnalysis?: string;

		/**
		 * 负责人ID
		 */
		ownerUserId?: number;

		/**
		 * 负责人
		 */
		ownerName?: string;

		/**
		 * 最后编辑人ID
		 */
		lastEditUserId?: number;

		/**
		 * 最后编辑人
		 */
		lastEditName?: string;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanyPurchaseContractEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * Purchase contract no
		 */
		contractNo?: string;

		/**
		 * Purchase order no
		 */
		orderNo?: string;

		/**
		 * Supplier ID
		 */
		supplierId?: number;

		/**
		 * Supplier name
		 */
		supplierName?: string;

		/**
		 * Supplier type: temporary/formal
		 */
		supplierType?: string;

		/**
		 * Purchase amount
		 */
		purchaseAmount?: number;

		/**
		 * Order date
		 */
		orderDate?: Date;

		/**
		 * Expected arrival date
		 */
		expectedArrivalDate?: Date;

		/**
		 * Contract attachments
		 */
		attachments?: any;

		/**
		 * Remark
		 */
		remark?: string;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanyQuoteEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 报价单号
		 */
		quoteNo?: string;

		/**
		 * 询价ID
		 */
		inquiryId?: number;

		/**
		 * 询价类型
		 */
		inquiryType?: number;

		/**
		 * 分解成本1-备件
		 */
		costSpareParts?: string;

		/**
		 * 分解成本2-工具
		 */
		costTools?: string;

		/**
		 * 分解成本3-软件
		 */
		costSoftware?: string;

		/**
		 * 分解成本4-人工（可逐条添加）
		 */
		costLaborItems?: any;

		/**
		 * 分解成本5-交通
		 */
		costTraffic?: string;

		/**
		 * 分解成本6-售后
		 */
		costAfterSales?: string;

		/**
		 * 分解成本7-培训报告
		 */
		costTrainingReport?: string;

		/**
		 * 总成本
		 */
		totalCost?: number;

		/**
		 * 供应商
		 */
		supplier?: string;

		/**
		 * 未税报价
		 */
		priceExclTax?: number;

		/**
		 * 税率（%）
		 */
		taxRate?: number;

		/**
		 * 含税报价
		 */
		priceInclTax?: number;

		/**
		 * 备件类报价明细（多物料×多供应商）
		 */
		spareQuoteItems?: any;

		/**
		 * 创建人ID
		 */
		createUserId?: number;

		/**
		 * 是否已拒绝
		 */
		isRejected?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 询价单号
		 */
		inquiryNo?: string;

		/**
		 * 客户
		 */
		inquiryCustomer?: string;

		/**
		 * 项目名称
		 */
		inquiryProjectName?: string;

		/**
		 * 项目工期开始
		 */
		inquiryProjectStartDate?: Date;

		/**
		 * 项目工期结束
		 */
		inquiryProjectEndDate?: Date;

		/**
		 * 询价类型
		 */
		inquiryInquiryType?: number;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface CompanySupplierEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * Supplier name
		 */
		supplierName?: string;

		/**
		 * Supplier type: temporary/formal
		 */
		supplierType?: string;

		/**
		 * Supplier source
		 */
		supplierSource?: string;

		/**
		 * Remark
		 */
		remark?: string;

		/**
		 * Contact name
		 */
		contactName?: string;

		/**
		 * Contact info
		 */
		contactInfo?: string;

		/**
		 * Information status: active/pending/dormant
		 */
		infoStatus?: string;

		/**
		 * Manage status: valid/invalid
		 */
		manageStatus?: string;

		/**
		 * Supplier nature
		 */
		supplierNature?: string;

		/**
		 * Business category list
		 */
		businessCategory?: any;

		/**
		 * Payment term days
		 */
		paymentTerm?: number;

		/**
		 * Cooperation relation
		 */
		cooperationRelation?: string;

		/**
		 * AI background check
		 */
		aiBackgroundCheck?: string;

		/**
		 * AI supplier profile
		 */
		aiSupplierProfile?: string;

		/**
		 * Invalid reason
		 */
		invalidReason?: string;

		/**
		 * First quote date
		 */
		quoteStartTime?: Date;

		/**
		 * Last quote date
		 */
		lastQuoteTime?: Date;

		/**
		 * Created by user id
		 */
		createUserId?: number;

		/**
		 * Last edit user id
		 */
		lastEditUserId?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface DemoGoodsEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 标题
		 */
		title?: string;

		/**
		 * 价格
		 */
		price?: number;

		/**
		 * 描述
		 */
		description?: string;

		/**
		 * 主图
		 */
		mainImage?: string;

		/**
		 * 分类
		 */
		type?: number;

		/**
		 * 状态
		 */
		status?: number;

		/**
		 * 示例图
		 */
		exampleImages?: any;

		/**
		 * 库存
		 */
		stock?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 昵称
		 */
		userName?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface DictInfoEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 类型ID
		 */
		typeId?: number;

		/**
		 * 名称
		 */
		name?: string;

		/**
		 * 值
		 */
		value?: string;

		/**
		 * 排序
		 */
		orderNum?: number;

		/**
		 * 备注
		 */
		remark?: string;

		/**
		 * 父ID
		 */
		parentId?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface DictTypeEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 名称
		 */
		name?: string;

		/**
		 * 标识
		 */
		key?: string;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface PluginInfoEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 名称
		 */
		name?: string;

		/**
		 * 简介
		 */
		description?: string;

		/**
		 * Key名
		 */
		keyName?: string;

		/**
		 * Hook
		 */
		hook?: string;

		/**
		 * 描述
		 */
		readme?: string;

		/**
		 * 版本
		 */
		version?: string;

		/**
		 * Logo(base64)
		 */
		logo?: string;

		/**
		 * 作者
		 */
		author?: string;

		/**
		 * 状态 0-禁用 1-启用
		 */
		status?: number;

		/**
		 * 内容
		 */
		content?: any;

		/**
		 * ts内容
		 */
		tsContent?: any;

		/**
		 * 插件的plugin.json
		 */
		pluginJson?: any;

		/**
		 * 配置
		 */
		config?: any;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface RecycleDataEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 表
		 */
		entityInfo?: any;

		/**
		 * 操作人
		 */
		userId?: number;

		/**
		 * 被删除的数据
		 */
		data?: any;

		/**
		 * 请求的接口
		 */
		url?: string;

		/**
		 * 请求参数
		 */
		params?: any;

		/**
		 * 删除数据条数
		 */
		count?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 姓名
		 */
		userName?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface SpaceInfoEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 地址
		 */
		url?: string;

		/**
		 * 类型
		 */
		type?: string;

		/**
		 * 分类ID
		 */
		classifyId?: number;

		/**
		 * 文件id
		 */
		fileId?: string;

		/**
		 * 文件名
		 */
		name?: string;

		/**
		 * 文件大小
		 */
		size?: number;

		/**
		 * 文档版本
		 */
		version?: number;

		/**
		 * 文件位置
		 */
		key?: string;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface SpaceTypeEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 类别名称
		 */
		name?: string;

		/**
		 * 父分类ID
		 */
		parentId?: number;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface TaskInfoEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 任务ID
		 */
		jobId?: string;

		/**
		 * 任务配置
		 */
		repeatConf?: string;

		/**
		 * 名称
		 */
		name?: string;

		/**
		 * cron
		 */
		cron?: string;

		/**
		 * 最大执行次数 不传为无限次
		 */
		limit?: number;

		/**
		 * 每间隔多少毫秒执行一次 如果cron设置了 这项设置就无效
		 */
		every?: number;

		/**
		 * 备注
		 */
		remark?: string;

		/**
		 * 状态 0-停止 1-运行
		 */
		status?: number;

		/**
		 * 开始时间
		 */
		startDate?: Date;

		/**
		 * 结束时间
		 */
		endDate?: Date;

		/**
		 * 数据
		 */
		data?: string;

		/**
		 * 执行的service实例ID
		 */
		service?: string;

		/**
		 * 状态 0-系统 1-用户
		 */
		type?: number;

		/**
		 * 下一次执行时间
		 */
		nextRunTime?: Date;

		/**
		 * 状态 0-cron 1-时间间隔
		 */
		taskType?: number;

		/**
		 * undefined
		 */
		lastExecuteTime?: Date;

		/**
		 * undefined
		 */
		lockExpireTime?: Date;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface UserAddressEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 用户ID
		 */
		userId?: number;

		/**
		 * 联系人
		 */
		contact?: string;

		/**
		 * 手机号
		 */
		phone?: string;

		/**
		 * 省
		 */
		province?: string;

		/**
		 * 市
		 */
		city?: string;

		/**
		 * 区
		 */
		district?: string;

		/**
		 * 地址
		 */
		address?: string;

		/**
		 * 是否默认
		 */
		isDefault?: boolean;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	interface UserInfoEntity {
		/**
		 * ID
		 */
		id?: number;

		/**
		 * 登录唯一ID
		 */
		unionid?: string;

		/**
		 * 头像
		 */
		avatarUrl?: string;

		/**
		 * 昵称
		 */
		nickName?: string;

		/**
		 * 手机号
		 */
		phone?: string;

		/**
		 * 性别
		 */
		gender?: number;

		/**
		 * 状态
		 */
		status?: number;

		/**
		 * 登录方式
		 */
		loginType?: number;

		/**
		 * 密码
		 */
		password?: string;

		/**
		 * 介绍
		 */
		description?: string;

		/**
		 * 创建时间
		 */
		createTime?: string;

		/**
		 * 更新时间
		 */
		updateTime?: string;

		/**
		 * 任意键值
		 */
		[key: string]: any;
	}

	type json = any;

	type DictKey = "brand" | "occupation";

	interface PagePagination {
		size: number;
		page: number;
		total: number;
		[key: string]: any;
	}

	interface PageResponse<T> {
		pagination: PagePagination;
		list: T[];
		[key: string]: any;
	}

	interface BaseSysLogPageResponse {
		pagination: PagePagination;
		list: BaseSysLogEntity[];
	}

	interface BaseSysMenuPageResponse {
		pagination: PagePagination;
		list: BaseSysMenuEntity[];
	}

	interface BaseSysParamPageResponse {
		pagination: PagePagination;
		list: BaseSysParamEntity[];
	}

	interface BaseSysRolePageResponse {
		pagination: PagePagination;
		list: BaseSysRoleEntity[];
	}

	interface BaseSysUserPageResponse {
		pagination: PagePagination;
		list: BaseSysUserEntity[];
	}

	interface CompanyContractMgmtPageResponse {
		pagination: PagePagination;
		list: CompanyContractMgmtEntity[];
	}

	interface CompanyCustomerPageResponse {
		pagination: PagePagination;
		list: CompanyCustomerEntity[];
	}

	interface CompanyFollowUpRecordPageResponse {
		pagination: PagePagination;
		list: CompanyFollowUpRecordEntity[];
	}

	interface CompanyInquiryPageResponse {
		pagination: PagePagination;
		list: CompanyInquiryEntity[];
	}

	interface CompanyInvoicePageResponse {
		pagination: PagePagination;
		list: CompanyInvoiceEntity[];
	}

	interface CompanyLeadPageResponse {
		pagination: PagePagination;
		list: CompanyLeadEntity[];
	}

	interface CompanyPurchaseContractPageResponse {
		pagination: PagePagination;
		list: CompanyPurchaseContractEntity[];
	}

	interface CompanyQuotePageResponse {
		pagination: PagePagination;
		list: CompanyQuoteEntity[];
	}

	interface CompanySupplierPageResponse {
		pagination: PagePagination;
		list: CompanySupplierEntity[];
	}

	interface DemoGoodsPageResponse {
		pagination: PagePagination;
		list: DemoGoodsEntity[];
	}

	interface DictInfoPageResponse {
		pagination: PagePagination;
		list: DictInfoEntity[];
	}

	interface DictTypePageResponse {
		pagination: PagePagination;
		list: DictTypeEntity[];
	}

	interface PluginInfoPageResponse {
		pagination: PagePagination;
		list: PluginInfoEntity[];
	}

	interface RecycleDataPageResponse {
		pagination: PagePagination;
		list: RecycleDataEntity[];
	}

	interface SpaceInfoPageResponse {
		pagination: PagePagination;
		list: SpaceInfoEntity[];
	}

	interface SpaceTypePageResponse {
		pagination: PagePagination;
		list: SpaceTypeEntity[];
	}

	interface TaskInfoPageResponse {
		pagination: PagePagination;
		list: TaskInfoEntity[];
	}

	interface UserAddressPageResponse {
		pagination: PagePagination;
		list: UserAddressEntity[];
	}

	interface UserInfoPageResponse {
		pagination: PagePagination;
		list: UserInfoEntity[];
	}

	interface BaseCoding {
		/**
		 * 获取模块目录结构
		 */
		getModuleTree(data?: any): Promise<any>;

		/**
		 * 创建代码
		 */
		createCode(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { getModuleTree: string; createCode: string };

		/**
		 * 权限状态
		 */
		_permission: { getModuleTree: boolean; createCode: boolean };

		request: Request;
	}

	interface BaseComm {
		/**
		 * 修改个人信息
		 */
		personUpdate(data?: any): Promise<any>;

		/**
		 * 文件上传模式
		 */
		uploadMode(data?: any): Promise<any>;

		/**
		 * 权限与菜单
		 */
		permmenu(data?: any): Promise<any>;

		/**
		 * 编程
		 */
		program(data?: any): Promise<any>;

		/**
		 * 个人信息
		 */
		person(data?: any): Promise<any>;

		/**
		 * 文件上传
		 */
		upload(data?: any): Promise<any>;

		/**
		 * 退出
		 */
		logout(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			personUpdate: string;
			uploadMode: string;
			permmenu: string;
			program: string;
			person: string;
			upload: string;
			logout: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			personUpdate: boolean;
			uploadMode: boolean;
			permmenu: boolean;
			program: boolean;
			person: boolean;
			upload: boolean;
			logout: boolean;
		};

		request: Request;
	}

	interface BaseOpen {
		/**
		 * 刷新token
		 */
		refreshToken(data?: any): Promise<any>;

		/**
		 * 验证码
		 */
		captcha(data?: any): Promise<any>;

		/**
		 * 登录
		 */
		login(data?: any): Promise<any>;

		/**
		 * 获得网页内容的参数值
		 */
		html(data?: any): Promise<any>;

		/**
		 * 实体信息与路径
		 */
		eps(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			refreshToken: string;
			captcha: string;
			login: string;
			html: string;
			eps: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			refreshToken: boolean;
			captcha: boolean;
			login: boolean;
			html: boolean;
			eps: boolean;
		};

		request: Request;
	}

	interface BaseSysDepartment {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 排序
		 */
		order(data?: any): Promise<any>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<BaseSysDepartmentEntity[]>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { delete: string; update: string; order: string; list: string; add: string };

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			order: boolean;
			list: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface BaseSysLog {
		/**
		 * 日志保存时间
		 */
		setKeep(data?: any): Promise<any>;

		/**
		 * 获得日志保存时间
		 */
		getKeep(data?: any): Promise<any>;

		/**
		 * 清理
		 */
		clear(data?: any): Promise<any>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<BaseSysLogPageResponse>;

		/**
		 * 权限标识
		 */
		permission: { setKeep: string; getKeep: string; clear: string; page: string };

		/**
		 * 权限状态
		 */
		_permission: { setKeep: boolean; getKeep: boolean; clear: boolean; page: boolean };

		request: Request;
	}

	interface BaseSysMenu {
		/**
		 * 创建代码
		 */
		create(data?: any): Promise<any>;

		/**
		 * 导出
		 */
		export(data?: any): Promise<any>;

		/**
		 * 导入
		 */
		import(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 解析
		 */
		parse(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<BaseSysMenuEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<BaseSysMenuEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<BaseSysMenuPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			create: string;
			export: string;
			import: string;
			delete: string;
			update: string;
			parse: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			create: boolean;
			export: boolean;
			import: boolean;
			delete: boolean;
			update: boolean;
			parse: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface BaseSysParam {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 获得网页内容的参数值
		 */
		html(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<BaseSysParamEntity>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<BaseSysParamPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			html: string;
			info: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			html: boolean;
			info: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface BaseSysRole {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<BaseSysRoleEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<BaseSysRoleEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<BaseSysRolePageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface BaseSysUser {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 移动部门
		 */
		move(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<BaseSysUserEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<BaseSysUserEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<BaseSysUserPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			move: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			move: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanyContract {
		/**
		 * 生成合同（触发 Dify）
		 */
		generate(data?: any): Promise<any>;

		/**
		 * 下载合同 Word 文件
		 */
		download(data?: any): Promise<any>;

		/**
		 * 查询合同生成状态
		 */
		poll(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { generate: string; download: string; poll: string };

		/**
		 * 权限状态
		 */
		_permission: { generate: boolean; download: boolean; poll: boolean };

		request: Request;
	}

	interface CompanyContractMgmt {
		/**
		 * 获取合同类别列表
		 */
		getCategories(data?: any): Promise<any>;

		/**
		 * 合同高级分页查询
		 */
		contractPage(data?: any): Promise<any>;

		/**
		 * 合同详情查询
		 */
		contractInfo(data?: any): Promise<any>;

		/**
		 * 逻辑删除合同
		 */
		logicDelete(data?: any): Promise<any>;

		/**
		 * 获取合同类别列表（含模板路径）
		 */
		categories(data?: any): Promise<any>;

		/**
		 * 下载合同模板文件
		 */
		template(data?: any): Promise<any>;

		/**
		 * 下载合同文件
		 */
		download(data?: any): Promise<any>;

		/**
		 * 逻辑删除合同
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanyContractMgmtEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanyContractMgmtEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanyContractMgmtPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			getCategories: string;
			contractPage: string;
			contractInfo: string;
			logicDelete: string;
			categories: string;
			template: string;
			download: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			getCategories: boolean;
			contractPage: boolean;
			contractInfo: boolean;
			logicDelete: boolean;
			categories: boolean;
			template: boolean;
			download: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanyCustomer {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanyCustomerEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanyCustomerEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanyCustomerPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanyFollowUpRecord {
		/**
		 * getCustomerOrderData
		 */
		getCustomerOrderData(data?: any): Promise<any>;

		/**
		 * getReminderRecords
		 */
		getReminderRecords(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanyFollowUpRecordEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanyFollowUpRecordEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanyFollowUpRecordPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			getCustomerOrderData: string;
			getReminderRecords: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			getCustomerOrderData: boolean;
			getReminderRecords: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanyInquiry {
		/**
		 * 已成单，转换合同订单
		 */
		convertToContractOrder(data?: any): Promise<any>;

		/**
		 * 保存销售实际报价
		 */
		saveSalesPricing(data?: any): Promise<any>;

		/**
		 * 提交成单结果
		 */
		saveDealResult(data?: any): Promise<any>;

		/**
		 * 同步报价操作权限
		 */
		syncQuotePerms(data?: any): Promise<any>;

		/**
		 * 同步报价业务状态
		 */
		syncBizStatus(data?: any): Promise<any>;

		/**
		 * 未成单
		 */
		saveLostDeal(data?: any): Promise<any>;

		/**
		 * 报价单进度分页（含负责人）
		 */
		progressPage(data?: any): Promise<any>;

		/**
		 * 接受报价
		 */
		accept(data?: any): Promise<any>;

		/**
		 * 拒绝报价
		 */
		reject(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanyInquiryEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanyInquiryEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanyInquiryPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			convertToContractOrder: string;
			saveSalesPricing: string;
			saveDealResult: string;
			syncQuotePerms: string;
			syncBizStatus: string;
			saveLostDeal: string;
			progressPage: string;
			accept: string;
			reject: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			convertToContractOrder: boolean;
			saveSalesPricing: boolean;
			saveDealResult: boolean;
			syncQuotePerms: boolean;
			syncBizStatus: boolean;
			saveLostDeal: boolean;
			progressPage: boolean;
			accept: boolean;
			reject: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanyInvoice {
		/**
		 * 按客户读取最近一次开票的发票抬头信息
		 */
		invoiceProfileByCustomer(data?: any): Promise<any>;

		/**
		 * 按客户分页查询合同订单（开票选单）
		 */
		contractOrderPage(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanyInvoiceEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanyInvoiceEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanyInvoicePageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			invoiceProfileByCustomer: string;
			contractOrderPage: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			invoiceProfileByCustomer: boolean;
			contractOrderPage: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanyLead {
		/**
		 * 线索开发分页（进行中）
		 */
		developmentPage(data?: any): Promise<any>;

		/**
		 * 线索管理分页（结果态）
		 */
		managementPage(data?: any): Promise<any>;

		/**
		 * 线索转化成功
		 */
		toSuccess(data?: any): Promise<any>;

		/**
		 * 线索放弃
		 */
		toDiscard(data?: any): Promise<any>;

		/**
		 * 线索AI分析
		 */
		aiAnalyze(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanyLeadEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanyLeadEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanyLeadPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			developmentPage: string;
			managementPage: string;
			toSuccess: string;
			toDiscard: string;
			aiAnalyze: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			developmentPage: boolean;
			managementPage: boolean;
			toSuccess: boolean;
			toDiscard: boolean;
			aiAnalyze: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanyPurchaseContract {
		/**
		 * Quote product options for purchase contract
		 */
		quoteProductOptions(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanyPurchaseContractEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanyPurchaseContractEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanyPurchaseContractPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			quoteProductOptions: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			quoteProductOptions: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanyQuote {
		/**
		 * 销售询价需求分页（默认待报价）
		 */
		inquiryPage(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanyQuoteEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanyQuoteEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanyQuotePageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			inquiryPage: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			inquiryPage: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface CompanySupplier {
		/**
		 * AI background check placeholder
		 */
		aiBackgroundCheck(data?: any): Promise<any>;

		/**
		 * AI supplier profile placeholder
		 */
		aiSupplierProfile(data?: any): Promise<any>;

		/**
		 * Supplier quote records placeholder
		 */
		quoteRecords(data?: any): Promise<any>;

		/**
		 * Temporary supplier transfer to formal supplier
		 */
		transfer(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<CompanySupplierEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<CompanySupplierEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<CompanySupplierPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			aiBackgroundCheck: string;
			aiSupplierProfile: string;
			quoteRecords: string;
			transfer: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			aiBackgroundCheck: boolean;
			aiSupplierProfile: boolean;
			quoteRecords: boolean;
			transfer: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface DemoGoods {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<DemoGoodsEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<DemoGoodsEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<DemoGoodsPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface DemoTenant {
		/**
		 * 局部不使用多租户
		 */
		noTenant(data?: any): Promise<any>;

		/**
		 * 不使用多租户
		 */
		noUse(data?: any): Promise<any>;

		/**
		 * use
		 */
		use(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: { noTenant: string; noUse: string; use: string };

		/**
		 * 权限状态
		 */
		_permission: { noTenant: boolean; noUse: boolean; use: boolean };

		request: Request;
	}

	interface DictInfo {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 获得所有字典类型
		 */
		types(data?: any): Promise<any>;

		/**
		 * 获得字典数据
		 */
		data(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<DictInfoEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<DictInfoEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<DictInfoPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			types: string;
			data: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			types: boolean;
			data: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface DictType {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<DictTypeEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<DictTypeEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<DictTypePageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface PluginInfo {
		/**
		 * 安装插件
		 */
		install(data?: any): Promise<any>;

		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<PluginInfoEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<PluginInfoEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<PluginInfoPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			install: string;
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			install: boolean;
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface RecycleData {
		/**
		 * 恢复数据
		 */
		restore(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<RecycleDataEntity>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<RecycleDataPageResponse>;

		/**
		 * 权限标识
		 */
		permission: { restore: string; info: string; page: string };

		/**
		 * 权限状态
		 */
		_permission: { restore: boolean; info: boolean; page: boolean };

		request: Request;
	}

	interface SpaceInfo {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<SpaceInfoEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<SpaceInfoEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<SpaceInfoPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface SpaceType {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<SpaceTypeEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<SpaceTypeEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<SpaceTypePageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface TaskInfo {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 开始
		 */
		start(data?: any): Promise<any>;

		/**
		 * 执行一次
		 */
		once(data?: any): Promise<any>;

		/**
		 * 停止
		 */
		stop(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<TaskInfoEntity>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<TaskInfoPageResponse>;

		/**
		 * 日志
		 */
		log(data?: any): Promise<any>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			start: string;
			once: string;
			stop: string;
			info: string;
			page: string;
			log: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			start: boolean;
			once: boolean;
			stop: boolean;
			info: boolean;
			page: boolean;
			log: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface UserAddress {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<UserAddressEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<UserAddressEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<UserAddressPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface UserInfo {
		/**
		 * 删除
		 */
		delete(data?: any): Promise<any>;

		/**
		 * 修改
		 */
		update(data?: any): Promise<any>;

		/**
		 * 单个信息
		 */
		info(data?: any): Promise<UserInfoEntity>;

		/**
		 * 列表查询
		 */
		list(data?: any): Promise<UserInfoEntity[]>;

		/**
		 * 分页查询
		 */
		page(data?: any): Promise<UserInfoPageResponse>;

		/**
		 * 新增
		 */
		add(data?: any): Promise<any>;

		/**
		 * 权限标识
		 */
		permission: {
			delete: string;
			update: string;
			info: string;
			list: string;
			page: string;
			add: string;
		};

		/**
		 * 权限状态
		 */
		_permission: {
			delete: boolean;
			update: boolean;
			info: boolean;
			list: boolean;
			page: boolean;
			add: boolean;
		};

		request: Request;
	}

	interface RequestOptions {
		url: string;
		method?: "OPTIONS" | "GET" | "HEAD" | "POST" | "PUT" | "DELETE" | "TRACE" | "CONNECT";
		data?: any;
		params?: any;
		headers?: any;
		timeout?: number;
		[key: string]: any;
	}

	type Request = (options: RequestOptions) => Promise<any>;

	type Service = {
		request: Request;

		base: {
			coding: BaseCoding;
			comm: BaseComm;
			open: BaseOpen;
			sys: {
				department: BaseSysDepartment;
				log: BaseSysLog;
				menu: BaseSysMenu;
				param: BaseSysParam;
				role: BaseSysRole;
				user: BaseSysUser;
			};
		};
		company: {
			contract: CompanyContract;
			contractMgmt: CompanyContractMgmt;
			customer: CompanyCustomer;
			followUpRecord: CompanyFollowUpRecord;
			inquiry: CompanyInquiry;
			invoice: CompanyInvoice;
			lead: CompanyLead;
			purchaseContract: CompanyPurchaseContract;
			quote: CompanyQuote;
			supplier: CompanySupplier;
		};
		demo: { goods: DemoGoods; tenant: DemoTenant };
		dict: { info: DictInfo; type: DictType };
		plugin: { info: PluginInfo };
		recycle: { data: RecycleData };
		space: { info: SpaceInfo; type: SpaceType };
		task: { info: TaskInfo };
		user: { address: UserAddress; info: UserInfo };
	};
}
