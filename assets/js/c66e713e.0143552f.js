"use strict";(self.webpackChunknestjs_query=self.webpackChunknestjs_query||[]).push([[1409],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>f});var a=n(7294);function l(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){l(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,a,l=function(e,t){if(null==e)return{};var n,a,l={},i=Object.keys(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||(l[n]=e[n]);return l}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(l[n]=e[n])}return l}var s=a.createContext({}),p=function(e){var t=a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):r(r({},t),e)),n},u=function(e){var t=p(e.components);return a.createElement(s.Provider,{value:t},e.children)},m="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,l=e.mdxType,i=e.originalType,s=e.parentName,u=o(e,["components","mdxType","originalType","parentName"]),m=p(n),d=l,f=m["".concat(s,".").concat(d)]||m[d]||c[d]||i;return n?a.createElement(f,r(r({ref:t},u),{},{components:n})):a.createElement(f,r({ref:t},u))}));function f(e,t){var n=arguments,l=t&&t.mdxType;if("string"==typeof e||l){var i=n.length,r=new Array(i);r[0]=d;var o={};for(var s in t)hasOwnProperty.call(t,s)&&(o[s]=t[s]);o.originalType=e,o[m]="string"==typeof e?e:l,r[1]=o;for(var p=2;p<i;p++)r[p]=n[p];return a.createElement.apply(null,r)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},3314:(e,t,n)=>{n.d(t,{Z:()=>r});var a=n(7294),l=n(6010);const i={tabItem:"tabItem_Ymn6"};function r(e){var t=e.children,n=e.hidden,r=e.className;return a.createElement("div",{role:"tabpanel",className:(0,l.Z)(i.tabItem,r),hidden:n},t)}},1291:(e,t,n)=>{n.d(t,{Z:()=>c});var a=n(7462),l=n(7294),i=n(6010),r=n(2389),o=n(7392),s=n(7094),p=n(2466);const u={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};function m(e){var t,n,r=e.lazy,m=e.block,c=e.defaultValue,d=e.values,f=e.groupId,k=e.className,g=l.Children.map(e.children,(function(e){if((0,l.isValidElement)(e)&&"value"in e.props)return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})),N=null!=d?d:g.map((function(e){var t=e.props;return{value:t.value,label:t.label,attributes:t.attributes}})),y=(0,o.l)(N,(function(e,t){return e.value===t.value}));if(y.length>0)throw new Error('Docusaurus error: Duplicate values "'+y.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.');var h=null===c?c:null!=(t=null!=c?c:null==(n=g.find((function(e){return e.props.default})))?void 0:n.props.value)?t:g[0].props.value;if(null!==h&&!N.some((function(e){return e.value===h})))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+h+'" but none of its children has the corresponding value. Available values are: '+N.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");var v=(0,s.U)(),b=v.tabGroupChoices,C=v.setTabGroupChoices,T=(0,l.useState)(h),q=T[0],w=T[1],O=[],I=(0,p.o5)().blockElementScrollPositionUntilNextRender;if(null!=f){var j=b[f];null!=j&&j!==q&&N.some((function(e){return e.value===j}))&&w(j)}var S=function(e){var t=e.currentTarget,n=O.indexOf(t),a=N[n].value;a!==q&&(I(t),w(a),null!=f&&C(f,String(a)))},E=function(e){var t,n=null;switch(e.key){case"Enter":S(e);break;case"ArrowRight":var a,l=O.indexOf(e.currentTarget)+1;n=null!=(a=O[l])?a:O[0];break;case"ArrowLeft":var i,r=O.indexOf(e.currentTarget)-1;n=null!=(i=O[r])?i:O[O.length-1]}null==(t=n)||t.focus()};return l.createElement("div",{className:(0,i.Z)("tabs-container",u.tabList)},l.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,i.Z)("tabs",{"tabs--block":m},k)},N.map((function(e){var t=e.value,n=e.label,r=e.attributes;return l.createElement("li",(0,a.Z)({role:"tab",tabIndex:q===t?0:-1,"aria-selected":q===t,key:t,ref:function(e){return O.push(e)},onKeyDown:E,onClick:S},r,{className:(0,i.Z)("tabs__item",u.tabItem,null==r?void 0:r.className,{"tabs__item--active":q===t})}),null!=n?n:t)}))),r?(0,l.cloneElement)(g.filter((function(e){return e.props.value===q}))[0],{className:"margin-top--md"}):l.createElement("div",{className:"margin-top--md"},g.map((function(e,t){return(0,l.cloneElement)(e,{key:t,hidden:e.props.value!==q})}))))}function c(e){var t=(0,r.Z)();return l.createElement(m,(0,a.Z)({key:String(t)},e))}},3870:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>u,default:()=>g,frontMatter:()=>p,metadata:()=>m,toc:()=>d});var a=n(7462),l=n(3366),i=(n(7294),n(3905)),r=n(1291),o=n(3314),s=["components"],p={title:"Queries"},u=void 0,m={unversionedId:"concepts/queries",id:"concepts/queries",title:"Queries",description:"The core of nestjs-query is the Query, it is used by @ptc-org/nestjs-query-graphql, @ptc-org/nestjs-query-typeorm",source:"@site/docs/concepts/queries.mdx",sourceDirName:"concepts",slug:"/concepts/queries",permalink:"/nestjs-query/docs/concepts/queries",draft:!1,editUrl:"https://github.com/tripss/nestjs-query/edit/master/documentation/docs/concepts/queries.mdx",tags:[],version:"current",frontMatter:{title:"Queries"},sidebar:"docs",previous:{title:"DTOs",permalink:"/nestjs-query/docs/concepts/dtos"},next:{title:"QueryService",permalink:"/nestjs-query/docs/concepts/services"}},c={},d=[{value:"Filtering",id:"filtering",level:2},{value:"Simple",id:"simple",level:3},{value:"Multiple Fields",id:"multiple-fields",level:3},{value:"Multiple Comparisons on a single field.",id:"multiple-comparisons-on-a-single-field",level:3},{value:"And/Or",id:"andor",level:3},{value:"Paging",id:"paging",level:2},{value:"Sorting",id:"sorting",level:2},{value:"Filter Reference",id:"filter-reference",level:2},{value:"Common Comparisons",id:"common-comparisons",level:3},{value:"String Comparisons",id:"string-comparisons",level:3}],f={toc:d},k="wrapper";function g(e){var t=e.components,n=(0,l.Z)(e,s);return(0,i.kt)(k,(0,a.Z)({},f,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,"The core of ",(0,i.kt)("inlineCode",{parentName:"p"},"nestjs-query")," is the ",(0,i.kt)("inlineCode",{parentName:"p"},"Query"),", it is used by ",(0,i.kt)("inlineCode",{parentName:"p"},"@ptc-org/nestjs-query-graphql"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"@ptc-org/nestjs-query-typeorm"),"\n",(0,i.kt)("inlineCode",{parentName:"p"},"@ptc-org/nestjs-query-sequelize"),", ",(0,i.kt)("inlineCode",{parentName:"p"},"@ptc-org/nestjs-query-mongoose")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"@ptc-org/nestjs-query-typegoose"),"."),(0,i.kt)("p",null,"The query interface contains three optional fields."),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"filter")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"paging")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"sorting"))),(0,i.kt)("p",null,"All examples will be based on the following class."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"interface MyClass {\n  title: string;\n  completed: boolean;\n  age: number;\n}\n")),(0,i.kt)("h2",{id:"filtering"},"Filtering"),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"filter")," field allows the filtering of fields based on the shape of the object the filter is used for."),(0,i.kt)("p",null,"See the ",(0,i.kt)("a",{parentName:"p",href:"#filter-reference"},"filter reference")," for a complete list of comparisons available."),(0,i.kt)("admonition",{type:"note"},(0,i.kt)("p",{parentName:"admonition"},"The ",(0,i.kt)("inlineCode",{parentName:"p"},"Filter")," interface is typesafe and the typescript compiler will complain if you include extra fields that are not present on the type you are creating the query for.")),(0,i.kt)("p",null,"Lets create a simple filter that would allow us to filter for titles equal to ",(0,i.kt)("inlineCode",{parentName:"p"},"'Foo Bar'")),(0,i.kt)("h3",{id:"simple"},"Simple"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"import { Query } from '@ptc-org/nestjs-query-core';\n\nconst q: Query<MyClass> = {\n  filter: {\n    title: { eq: 'Foo Bar' },\n  },\n};\n")),(0,i.kt)("h3",{id:"multiple-fields"},"Multiple Fields"),(0,i.kt)("p",null,"You can also filter on multiple fields."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"import { Query } from '@ptc-org/nestjs-query-core';\n\nconst q: Query<MyClass> = {\n  filter: {\n    // title = 'Foo Bar' AND completed IS TRUE and age > 10\n    title: { eq: 'Foo Bar' },\n    completed: { is: true },\n    age: { gt: 10 },\n  },\n};\n")),(0,i.kt)("h3",{id:"multiple-comparisons-on-a-single-field"},"Multiple Comparisons on a single field."),(0,i.kt)("p",null,"If you include multiple comparisons for a single field they will be ORed together."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"import { Query } from '@ptc-org/nestjs-query-core';\n\nconst q: Query<MyClass> = {\n  filter: {\n    // title = 'Foo Bar' OR field LIKE '%foo%'\n    title: { eq: 'Foo Bar', like: '%foo%' },\n  },\n};\n")),(0,i.kt)("h3",{id:"andor"},"And/Or"),(0,i.kt)("p",null,"The filter also allows for more complex ",(0,i.kt)("inlineCode",{parentName:"p"},"and")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"or")," filters. The ",(0,i.kt)("inlineCode",{parentName:"p"},"and")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"or")," accept an array of filters allowing\nfor nested complex queries."),(0,i.kt)("p",null,"In this example we ",(0,i.kt)("inlineCode",{parentName:"p"},"AND")," two filters for the same property together: ",(0,i.kt)("inlineCode",{parentName:"p"},"age >= 10 AND age <= 20"),"."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const q: Query<MyClass> = {\n  filter: {\n    and: [{ age: { gte: 10 } }, { age: { lte: 20 } }],\n  },\n};\n")),(0,i.kt)("p",null,"In this example a simple ",(0,i.kt)("inlineCode",{parentName:"p"},"OR")," condition is created: ",(0,i.kt)("inlineCode",{parentName:"p"},"age >= 10 OR title NOT LIKE '%bar'")),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const q: Query<MyClass> = {\n  filter: {\n    or: [{ age: { gte: 10 } }, { title: { notLike: '%bar' } }],\n  },\n};\n")),(0,i.kt)("p",null,"This example combines ",(0,i.kt)("inlineCode",{parentName:"p"},"AND")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"OR")," filters: ",(0,i.kt)("inlineCode",{parentName:"p"},"age >= 10 AND (title LIKE '%bar' OR title = 'foobar')"),"."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const q: Query<MyClass> = {\n  filter: {\n    and: [\n      { age: { gte: 10 } },\n      {\n        or: [{ title: { like: '%bar' } }, { title: { eq: 'foobar' } }],\n      },\n    ],\n  },\n};\n")),(0,i.kt)("hr",null),(0,i.kt)("h2",{id:"paging"},"Paging"),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"core")," package defines a basic paging interface has two optional fields ",(0,i.kt)("inlineCode",{parentName:"p"},"limit")," and ",(0,i.kt)("inlineCode",{parentName:"p"},"offset"),"."),(0,i.kt)(r.Z,{defaultValue:"limit-offset",values:[{label:"Limit And Offset",value:"limit-offset"},{label:"Limit",value:"limit"},{label:"Offset",value:"offset"}],mdxType:"Tabs"},(0,i.kt)(o.Z,{value:"limit-offset",mdxType:"TabItem"},(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const q: Query<MyClass> = {\n  paging: {\n    limit: 10,\n    offset: 10,\n  },\n};\n"))),(0,i.kt)(o.Z,{value:"limit",mdxType:"TabItem"},(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const q: Query<MyClass> = {\n  paging: {\n    limit: 20,\n  },\n};\n"))),(0,i.kt)(o.Z,{value:"offset",mdxType:"TabItem"},(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const q: Query<MyClass> = {\n  paging: {\n    offset: 10,\n  },\n};\n")))),(0,i.kt)("admonition",{type:"note"},(0,i.kt)("p",{parentName:"admonition"},"When using filters on relations with ",(0,i.kt)("inlineCode",{parentName:"p"},"typeorm")," in combination with paging, performance can be degraded on large result\nsets. For more info see this ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/tripss/nestjs-query/issues/954"},"issue")),(0,i.kt)("p",{parentName:"admonition"},"In short two queries will be executed:"),(0,i.kt)("ul",{parentName:"admonition"},(0,i.kt)("li",{parentName:"ul"},"The first one fetching a distinct list of primary keys with paging applied."),(0,i.kt)("li",{parentName:"ul"},"The second uses primary keys from the first query to fetch the actual records."))),(0,i.kt)("hr",null),(0,i.kt)("h2",{id:"sorting"},"Sorting"),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"sorting")," field allows to specify the sort order for your query."),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"sorting")," field is an array of object containing:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"field")," - the field to sort on"),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"direction")," - ",(0,i.kt)("inlineCode",{parentName:"li"},"ASC")," or ",(0,i.kt)("inlineCode",{parentName:"li"},"DESC")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"nulls?")," - Optional nulls sort, ",(0,i.kt)("inlineCode",{parentName:"li"},"NULLS_FIRST")," or ",(0,i.kt)("inlineCode",{parentName:"li"},"NULLS_LAST"))),(0,i.kt)(r.Z,{defaultValue:"single",values:[{label:"Single-Sort",value:"single"},{label:"Multi-Sort",value:"multi"}],mdxType:"Tabs"},(0,i.kt)(o.Z,{value:"single",mdxType:"TabItem"},(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// import { SortDirection } from '@ptc-org/nestjs-query-core';\n\nconst q: Query<MyClass> = {\n  sorting: [{ field: 'title', direction: SortDirection.DESC }],\n};\n"))),(0,i.kt)(o.Z,{value:"multi",mdxType:"TabItem"},(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// import { SortDirection } from '@ptc-org/nestjs-query-core';\n\nconst q: Query<MyClass> = {\n  sorting: [\n    { field: 'title', direction: SortDirection.DESC },\n    { field: 'age', direction: SortDirection.ASC },\n  ],\n};\n")))),(0,i.kt)("h2",{id:"filter-reference"},"Filter Reference"),(0,i.kt)("p",null,"The ",(0,i.kt)("inlineCode",{parentName:"p"},"filter")," option supports the following field comparisons."),(0,i.kt)("admonition",{type:"note"},(0,i.kt)("p",{parentName:"admonition"},"The following examples show an approximation of the SQL that will be generated. The ORM will take care of handling the dialect specifics")),(0,i.kt)("h3",{id:"common-comparisons"},"Common Comparisons"),(0,i.kt)("p",null,"All types support the following comparisons."),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"is")," - Check is a field is ",(0,i.kt)("inlineCode",{parentName:"li"},"null"),", ",(0,i.kt)("inlineCode",{parentName:"li"},"true")," or ",(0,i.kt)("inlineCode",{parentName:"li"},"false"),".",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title IS NULL\n{\n  title: {\n    is: null;\n  }\n}\n// completed IS TRUE\n{\n  completed: {\n    is: true;\n  }\n}\n// completed IS false\n{\n  completed: {\n    is: false;\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"isNot")," - Check is a field is not ",(0,i.kt)("inlineCode",{parentName:"li"},"null"),", ",(0,i.kt)("inlineCode",{parentName:"li"},"true")," or ",(0,i.kt)("inlineCode",{parentName:"li"},"false"),".",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title IS NOT NULL\n{\n  title: {\n    isNot: null;\n  }\n}\n// completed IS NOT TRUE\n{\n  completed: {\n    isNot: true;\n  }\n}\n// completed IS NOT false\n{\n  completed: {\n    isNot: false;\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"neq")," - field is not equal to a value.",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title != 'foo'\n{\n  title: {\n    neq: 'foo';\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"gt")," - field is greater than a value.",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title > 'foo'\n{\n  title: {\n    gt: 'foo';\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"gte")," - field is greater than or equal to a value.",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title >= 'foo'\n{\n  title: {\n    gte: 'foo';\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"lt")," - field is less than a value.",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title < 'foo'\n{\n  title: {\n    lt: 'foo';\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"lte")," - field is less than or equal to a value.",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title <= 'foo'\n{\n  title: {\n    lte: 'foo';\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"in")," - field is in a list of values.",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title IN ('foo', 'bar', 'baz')\n{ title: { in: ['foo', 'bar', 'baz'] } }\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"notIn")," - field is not in a list of values.",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title NOT IN ('foo', 'bar', 'baz')\n{\n  title: {\n    notIn: ['foo', 'bar', 'baz'];\n  }\n}\n")))),(0,i.kt)("h3",{id:"string-comparisons"},"String Comparisons"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"like")," - field is like a value (case sensitive).",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title LIKE 'Foo%'\n{\n  title: {\n    like: 'Foo%';\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"notLike")," - field is not like a value (case sensitive).",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title NOT LIKE 'Foo%'\n{\n  title: {\n    notLike: 'Foo%';\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"iLike")," - field is like a value (case insensitive).",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title ILIKE 'Foo%'\n{\n  title: {\n    iLike: 'Foo%';\n  }\n}\n"))),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("inlineCode",{parentName:"li"},"notILike")," - field is not like a value (case insensitive).",(0,i.kt)("pre",{parentName:"li"},(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"// title NOT ILIKE 'Foo%'\n{\n  title: {\n    notILike: 'Foo%';\n  }\n}\n")))))}g.isMDXComponent=!0}}]);