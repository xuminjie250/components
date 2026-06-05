================================================================================
  DateTimePicker v1.2.0 — 自定义日期时间选择器 使用说明
================================================================================

一、简介
--------------------------------------------------------------------------------
  DateTimePicker 是一个纯 JavaScript 实现的日期时间选择器组件，不依赖任何第三方
  库（零依赖）。它将浏览器原生的 <input type="datetime-local"> 替换为美观易用的
  自定义面板，支持日期选择、时间选择、日历导航、国际化等丰富功能。

  兼容：IE11+ / Chrome / Firefox / Safari / Edge


二、快速开始
--------------------------------------------------------------------------------

  1. 引入文件：
     在 HTML 页面的 <head> 中引入 CSS，在页面底部引入 JS：

       <link rel="stylesheet" href="DateTimePicker.css">
       <script src="DateTimePicker.js"></script>

  2. 准备 HTML 元素：
     在页面中放置一个普通的 input 标签：

       <input type="datetime-local" id="myPicker">

  3. 初始化：
     在 JS 脚本中创建 DateTimePicker 实例：

       var picker = new DateTimePicker('#myPicker');

     此时原生 input 已被替换为自定义选择器，点击即可使用。


三、配置选项
--------------------------------------------------------------------------------
  创建实例时可以传入第二个参数 options，所有配置项如下：

    new DateTimePicker('#myPicker', {
        format:      'YYYY-MM-DD HH:mm',    // 显示格式，支持 YYYY MM DD HH mm
        placeholder: '请选择日期时间',        // 未选择时的占位提示文字
        minuteStep:  5,                     // 分钟选择步长：1 / 5 / 10 / 15 / 30
        zIndex:      1003,                  // 面板层级

        // 值变更回调
        onChange: function(value, instance) {
            console.log('当前值：', value);
        },

        // 国际化配置（按需覆盖，不传则默认中文）
        locale: {
            weekdays:        ['日','一','二','三','四','五','六'],
            months:          ['1月','2月','3月','4月','5月','6月',
                              '7月','8月','9月','10月','11月','12月'],
            today:           '今天',
            clear:           '清除',
            confirm:         '确定',
            cancel:          '取消',
            placeholder:     '请选择日期时间',
            datePlaceholder: '请选择日期',
            yearSuffix:      '年',
            monthSuffix:     '月'
        }
    });


四、英文 locale 示例
--------------------------------------------------------------------------------

    new DateTimePicker('#picker', {
        locale: {
            weekdays:        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
            months:          ['Jan','Feb','Mar','Apr','May','Jun',
                              'Jul','Aug','Sep','Oct','Nov','Dec'],
            today:           'Today',
            clear:           'Clear',
            confirm:         'OK',
            cancel:          'Cancel',
            placeholder:     'Select date & time',
            datePlaceholder: 'Select date',
            yearSuffix:      '',
            monthSuffix:     ''
        }
    });


五、公开 API
--------------------------------------------------------------------------------

  实例方法：

    picker.getValue()              获取格式化后的日期时间字符串
                                   示例："2025-06-15 09:30"，未选择返回 ""

    picker.setValue(val)           设置值，支持多种输入格式
                                   val 可以是：
                                     - 字符串 "2025-06-15" 或 "2025-06-15 09:30"
                                     - Date 对象 new Date()
                                     - 时间戳 1718400000000

    picker.getDate()               获取 Date 对象，未选择返回 null

    picker.setDate(date)           设置 Date 对象（链式调用）
                                   参数同 setValue

    picker.clear()                 清空已选值（链式调用）

    picker.open()                  编程方式打开选择面板（链式调用）

    picker.close()                 关闭选择面板（链式调用）

    picker.getElement()            获取原始 input 元素

    picker.getWrapper()            获取最外层包裹元素 DOM

    picker.destroy()               销毁实例，还原 DOM 并清理所有事件监听


  静态方法：

    DateTimePicker.version         版本号，当前 "1.2.0"

    DateTimePicker.initAll(options) 批量初始化页面中所有
                                   input[type="datetime-local"] 元素，
                                   返回 DateTimePicker[] 数组

    DateTimePicker.getInstances()  获取当前所有活跃的实例数组

    DateTimePicker.getDefaultLocale()
                                   获取默认 locale 配置的浅拷贝

    DateTimePicker.setDefaultLocale(override)
                                   批量覆盖默认 locale，影响后续创建的所有实例
                                   示例：
                                     DateTimePicker.setDefaultLocale({
                                         today: 'Today',
                                         clear: 'Clear'
                                     });


六、交互操作说明
--------------------------------------------------------------------------------

  (1) 点击输入框         → 弹出日期时间选择面板
  (2) 点击日期区域       → 弹出日历面板，支持日/月/年三级切换
  (3) 在日历上滚动滚轮   → 切换上/下一月（或上/下一年）
  (4) 点击时/分数值      → 弹出滚动选择列表
  (5) 双击时/分数值      → 进入键盘直接编辑模式（Enter 确认，Esc 取消）
  (6) 点击「今天」按钮   → 快速跳转到今天
  (7) 点击「清除」按钮   → 清空已选日期
  (8) 点击面板外部       → 自动关闭所有面板


七、与表单配合
--------------------------------------------------------------------------------

  确认选择后，组件会自动在原 input 上触发 change 事件，可直接配合以下场景：

    // 原生表单监听
    document.getElementById('myPicker').addEventListener('change', function(e) {
        console.log('表单值变更：', e.target.value);
    });

    // 配合 Vue
    <input type="datetime-local" v-model="dateValue">

    // 配合 React
    <input type="datetime-local" ref={inputRef} onChange={handleChange}>


八、注意事项
--------------------------------------------------------------------------------

  1. 必须先引入 DateTimePicker.css，再引入 DateTimePicker.js
  2. input 的 type 必须是 datetime-local
  3. 销毁实例后如需重新创建，需使用新的 input 元素
  4. 如需全局切换语言，建议在页面初始化时调用 setDefaultLocale()
  5. locale 中的 weekdays 数组长度必须为 7，months 必须为 12

================================================================================
  GitHub: https://github.com/xuminjie250/components
================================================================================
