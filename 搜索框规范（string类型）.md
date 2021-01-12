# 定义说明（已经废弃）

## 代码中的定义说明
目前还没完善，木有使用离子

# 分隔符说明

- `,` ： 每个搜索项的中间区分，使用`,`来区分，代码层面会 `split(',')` 来获取每一个搜索项
- `|` ： 每个搜索项的条件说明，为 `|` ，切割成每一个规则，进行搜索项的拼接
  - 第一项为类型，详情看下面 [各种类型的搜索展现](#各种类型的搜索展现)
  - 第二项为搜索名称，如果中间带 `.` 符号代表连表查询，这个时候需要写成 `$` ，同时需要后端支持这个类型。另外这里会有特定前缀自动生成搜索条件的 search_method 规则（这样子第五项就可以忽略，目前这个可能会变）。
      - in-name: ['name', 'in', [value]]
      - equal-name: ['name', '=', value]
      - not-name: ['name', '!=', value]
      - notIn-name: ['name', 'notIn', value]
      - gt-birthday: ['birthday', '>', value]
      - lt-birthday: ['birthday', '<', value]
      - gte-birthday: ['birthday', '>=', value]
      - lte-birthday: ['birthday', '<=', value]
      - not-birthday: ['birthday', '!=', value]
      - notIn-birthday: ['birthday', 'notIn', [value]]
  - 第三项为 label ，该搜索项目的名称。
  - 第四项为保留项，部分有意义，部分没意义，如果第一项为 select ，他就用来获取生成 options 的数据 key 。会在每一项搜索类型中增加说明
  - 第五项，搜索时候带过去的参数类型。一般为 `like`, `=`, `in`, `<`, `>`, `>=`, `<=`, `!=`。不过这个一般会自动生成，例如 input 类型一般为 `like` ，其他类型一般为 `=` 。
  - 更多项目，根据每个搜索类型的规则来。

# 各种类型的搜索展现

## input 类型的
- input|name|学生姓名 ：代表增加一个搜索名称为 name 的 input 输入框
- input|full_name|班级全程 ： 代表增加一个搜索名称为 full_name 的 input 输入框
- input|student$name|学生姓名 ： 代表增加一个搜索名称为 stutent.name 的 input 输入框

## select 类型的
- select|gender|性别 ： 代表一个 gender 字典的 select 搜索框，其搜索字段名为 gender，默认会从 __global 中获取。
- select|district_type|城镇类型|departments.district_type ： 代表一个 district_type 字典的搜索框，其中 options 的值从 departments.district_type 中获取（可能是 EDITABLE_DICT， 可能是 CONSTANTS, 可能是 DICT 中）。
- select|status|书籍状态|books.status ： 代表一个书籍状态的搜索框，搜索名为 status 。

## 外键选择
- foreign|student_id|学生|student ：代表 student 表格的外键选择，下拉的内容从 student 表格中获取，搜索key 为 student_id
- foreign|id|学生|classes ：代表 classes 表格的外键选择，下拉的内容从 classes 表格中获取， 搜索 key 为 id
- 其他规则待完善，这个比较复杂

## 时间的选择
- day|issue_date|出版时间 ： 标识一个时间搜索框，精确到几号，search_method 为 `=`
- year|issue_date|出版时间 ： 标识一个时间搜索框，精确到某一年， search_method 为 `=`
- month|issue_date|出版时间 ： 标识一个时间搜索框，精确到某一月份， search_method 为 `=`
- minute|pay_time|创建时间 ： 标识一个时间搜索框，精确到某分钟， search_method 为 `=`
- ~~hour|pay_time|创建时间 ： 假的，实在想不出为什么要搜索几点的东西。不支持~~
- HHmm|duty_time|值班时间: 只是单纯的选择某时某分，例如 09:00 开始值班的选择， search_method 为 = ，value 为format 的形式，如 0900
- range_*: 前面的几个，前面全部加上 range 前缀，就变成是时间区间选择， search_method 为 `>=` 和 `<=` 的集合

## 地区的选择

- area|city_id|城市|pid:100000000000 ：地区选择，其 options 的值为 `pid=100700000000` 的元素
- area|district_id|县区|form_value:city_id ：地区选择，假设表单中 city_id 的值为 `100700000000` ， 其 options 的值就为该搜索 `pid=100700000000` 的元素，根据 form_value 中指向的字段的值进行动态变更。（目前第四项这个可能会变）


