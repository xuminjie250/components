================================================================================
  DateTimePicker v1.3.0 更新说明
  发布日期：2026-06-06
================================================================================

【新增功能】

  1. disabled 禁用状态
     - 新增 options.disabled 配置项，设为 true 后输入框变灰、禁止所有交互
     - 新增 .dtp-disabled 样式类
     - 用法：{ disabled: true }

  2. minDate / maxDate 日期范围限制
     - 新增 options.minDate 和 options.maxDate，支持字符串/Date/时间戳
     - 超出范围的日期在日历中自动变灰且不可点击
     - 用法：{ minDate: '2025-01-01', maxDate: new Date() }

  3. formatDateTime 支持秒（ss）
     - 格式 token 新增 "ss"，format 可设置为 'YYYY-MM-DD HH:mm:ss'

【Bug 修复】

  4. 修复多实例关闭 bug
     - 问题：页面同时存在多个实例时，点击面板外部只关闭最后聚焦的实例
     - 修复：_bodyClickHandler 改为遍历所有实例逐个关闭

  5. 修复 _cancel 方法 Safari 兼容问题
     - 问题：取消时传入格式化字符串，Safari 对 "YYYY-MM-DD HH:mm" 格式解析不一致
     - 修复：改为传入 Date 对象而非格式化字符串

  6. 修复 minuteStep 选项的「死值」问题
     - 问题：当分钟值不在步长刻度上时（如 57 分钟、步长 5），
       滚轮列表中找不到对应选项，选中态丢失
     - 修复：自动取最近的有效刻度值并标记选中

【代码优化】

  7. 提取重复定位逻辑
     - 将 _positionPanel / _positionCalendar / _positionTimeScroll 三个方法
       合并为 _smartPosition(el, height, fixedClass)，减少约 60 行代码

  8. 简化 _buildTimeScroll 写法
     - 移除 IIFE + .bind(this) + .call(this) 的混合写法，改为纯闭包

  9. CSS 移除 !important
     - 3 处 !important 已移除，改为使用更高特异性选择器
     - 新增 .dtp-day-cell--disabled 样式（日期范围越界）

  10. 添加基础 ARIA 无障碍属性
      - customInput 添加 role="combobox" / aria-expanded / aria-haspopup
      - 面板开/关时动态更新 aria-expanded
      - 禁用状态设置 aria-disabled

【版本号】
  v1.2.0 → v1.3.0
  DateTimePicker.js:   38,240 → 39,007 bytes (+767)
  DateTimePicker.css:   8,889 →  9,141 bytes (+252)
  DateTimePicker.d.ts:  3,709 →  3,957 bytes (+248)