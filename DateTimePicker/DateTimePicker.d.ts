/*! ==============================================
   DateTimePicker v1.3.0
   TypeScript 类型定义
   ============================================== */

export as namespace DateTimePicker;

export = DateTimePicker;

declare class DateTimePicker {
    /**
     * 创建 DateTimePicker 实例
     * @param selectorOrEl CSS 选择器字符串或 HTMLInputElement 元素
     * @param options 配置选项
     */
    constructor(selectorOrEl: string | HTMLElement, options?: DateTimePickerOptions);

    /** 获取格式化后的日期时间字符串 */
    getValue(): string;

    /**
     * 设置日期时间值
     * @param val 支持日期字符串、Date 对象或时间戳
     */
    setValue(val: string | Date | number): void;

    /** 获取 Date 对象，未选择时返回 null */
    getDate(): Date | null;

    /**
     * 设置 Date 对象（链式调用）
     * @param date 日期字符串、Date 对象或时间戳
     */
    setDate(date: string | Date | number): this;

    /** 清空已选值（链式调用） */
    clear(): this;

    /** 获取原始 input 元素 */
    getElement(): HTMLInputElement;

    /** 获取最外层包裹元素 */
    getWrapper(): HTMLElement;

    /** 编程方式打开面板（链式调用） */
    open(): this;

    /** 关闭面板（链式调用） */
    close(): this;

    /**
     * 销毁实例，还原 DOM 并移除事件监听。
     * 销毁后该实例不可再使用。
     */
    destroy(): void;

    /** 版本号 */
    static version: string;

    /**
     * 批量初始化页面中所有 input[type="datetime-local"]
     * @param options 可选，应用于所有实例的配置
     */
    static initAll(options?: DateTimePickerOptions): DateTimePicker[];

    /** 获取当前所有活跃的 DateTimePicker 实例 */
    static getInstances(): DateTimePicker[];

    /** 获取默认 locale 配置的浅拷贝 */
    static getDefaultLocale(): DateTimePickerLocale;

    /**
     * 批量覆盖默认 locale（影响后续创建的所有实例）
     * @param localeOverride 要覆盖的 locale 字段
     */
    static setDefaultLocale(localeOverride: Partial<DateTimePickerLocale>): void;
}

declare interface DateTimePickerOptions {
    /**
     * 显示格式，支持 token: YYYY MM DD HH mm ss
     * @default 'YYYY-MM-DD HH:mm'
     */
    format?: string;

    /**
     * 占位文本
     * @default '请选择日期时间'
     */
    placeholder?: string;

    /**
     * 分钟选择步长
     * @default 1
     */
    minuteStep?: number;

    /**
     * 面板 z-index
     * @default 1003
     */
    zIndex?: number;

    /**
     * 是否禁用
     * @default false
     */
    disabled?: boolean;

    /**
     * 最小可选日期
     */
    minDate?: string | Date | number;

    /**
     * 最大可选日期
     */
    maxDate?: string | Date | number;

    /**
     * 值变更回调
     * @param value 格式化后的日期时间字符串，空字符串表示未选择
     * @param instance 当前 DateTimePicker 实例
     */
    onChange?: (value: string, instance: DateTimePicker) => void;

    /**
     * 国际化配置，按需覆盖字段
     */
    locale?: Partial<DateTimePickerLocale>;
}

declare interface DateTimePickerLocale {
    /** 星期标题，长度必须为 7 */
    weekdays: string[];

    /** 月份名称，长度必须为 12 */
    months: string[];

    /** "今天" 按钮 */
    today: string;

    /** "清除" 按钮 */
    clear: string;

    /** "确定" 按钮 */
    confirm: string;

    /** "取消" 按钮 */
    cancel: string;

    /** 未选择时的占位文本 */
    placeholder: string;

    /** 日期未选择时的提示文本 */
    datePlaceholder: string;

    /** 日历标题中年份后缀，中文为 '年'，英文可为空字符串 */
    yearSuffix: string;

    /** 日历标题中月份后缀，中文为 '月'，英文可为空字符串 */
    monthSuffix: string;
}