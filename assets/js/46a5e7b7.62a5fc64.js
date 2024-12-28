"use strict";(self.webpackChunknestjs_query=self.webpackChunknestjs_query||[]).push([[8586],{931:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>d,contentTitle:()=>i,default:()=>h,frontMatter:()=>o,metadata:()=>u,toc:()=>c});var t=r(4848),a=r(8453),l=r(1470),s=r(9365);const o={title:"Endpoints"},i=void 0,u={id:"graphql/queries/endpoints",title:"Endpoints",description:"The CRUDResolver automatically exposes two query endpoints. The endpoints names will be derived from",source:"@site/docs/graphql/queries/endpoints.mdx",sourceDirName:"graphql/queries",slug:"/graphql/queries/endpoints",permalink:"/nestjs-query/docs/graphql/queries/endpoints",draft:!1,unlisted:!1,editUrl:"https://github.com/tripss/nestjs-query/edit/master/documentation/docs/graphql/queries/endpoints.mdx",tags:[],version:"current",frontMatter:{title:"Endpoints"},sidebar:"docs",previous:{title:"Dataloaders",permalink:"/nestjs-query/docs/graphql/dataloaders"},next:{title:"Filtering",permalink:"/nestjs-query/docs/graphql/queries/filtering"}},d={},c=[{value:"Find By Id",id:"find-by-id",level:2},{value:"Querying",id:"querying",level:2}];function p(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",hr:"hr",li:"li",p:"p",pre:"pre",ul:"ul",...(0,a.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:["The ",(0,t.jsx)(n.a,{href:"../resolvers",children:"CRUDResolver"})," automatically exposes two query endpoints. The endpoints names will be derived from\nname provided to ",(0,t.jsx)(n.code,{children:"@ObjectType"})," or the class name."]}),"\n",(0,t.jsxs)(n.p,{children:["The following examples are based on the following ",(0,t.jsx)(n.code,{children:"TodoItemDTO"})]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.dto.ts"',children:"import { FilterableField } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';\n\n@ObjectType('TodoItem')\nexport class TodoItemDTO {\n  @IDField(() => ID)\n  id!: string;\n\n  @FilterableField()\n  title!: string;\n\n  @FilterableField()\n  completed!: boolean;\n\n  @FilterableField(() => GraphQLISODateTime)\n  created!: Date;\n\n  @FilterableField(() => GraphQLISODateTime)\n  updated!: Date;\n}\n\n"})}),"\n",(0,t.jsx)(n.p,{children:"In the following examples you will see two endpoints referenced"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"todoItem"})," - graphql endpoint to find a record by id."]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"todoItems"})," - graphql endpoint to filter, page, and sort records,"]}),"\n"]}),"\n",(0,t.jsx)(n.h2,{id:"find-by-id",children:"Find By Id"}),"\n",(0,t.jsxs)(n.p,{children:["The following example finds a ",(0,t.jsx)(n.code,{children:"TodoItem"})," by id."]}),"\n",(0,t.jsxs)(l.A,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],children:[(0,t.jsx)(s.A,{value:"graphql",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-graphql",children:'{\n  todoItem(id: "1") {\n    id\n    title\n    completed\n    created\n    updated\n  }\n}\n\n'})})}),(0,t.jsx)(s.A,{value:"response",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-json",children:'{\n  "data": {\n    "todoItem": {\n      "id": "1",\n      "title": "Create One Todo Item",\n      "completed": false,\n      "created": "2020-01-14T07:00:31.763Z",\n      "updated": "2020-01-14T07:00:31.763Z"\n    }\n  }\n}\n'})})})]}),"\n",(0,t.jsx)(n.hr,{}),"\n",(0,t.jsx)(n.h2,{id:"querying",children:"Querying"}),"\n",(0,t.jsxs)(n.p,{children:["As described above the ",(0,t.jsx)(n.code,{children:"CRUDResolver"})," will expose a query method called ",(0,t.jsx)(n.code,{children:"todoItems"}),". The result will be either\na ",(0,t.jsx)(n.a,{href:"https://relay.dev/graphql/connections.htm",children:(0,t.jsx)(n.code,{children:"connection"})})," or array depending on the ",(0,t.jsx)(n.a,{href:"./paging",children:"paging strategy you choose"})]}),"\n",(0,t.jsx)(n.admonition,{type:"note",children:(0,t.jsxs)(n.p,{children:["All examples below assume that a connection is returned but filtering and sorting work the same way for all paging\nstrategies. To read how to page collections read the ",(0,t.jsx)(n.a,{href:"./paging",children:"paging docs"})]})}),"\n",(0,t.jsxs)(n.p,{children:["By default if you do not provided an arguments it will uses a default value for ",(0,t.jsx)(n.a,{href:"../dtos#result-page-size",children:"the page size"})," and for the ",(0,t.jsx)(n.a,{href:"../dtos/#default-sort",children:"sorting"}),"."]}),"\n",(0,t.jsxs)(l.A,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],children:[(0,t.jsx)(s.A,{value:"graphql",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-graphql",children:"{\n  todoItems{\n    pageInfo{\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n    edges{\n      node{\n        id\n        title\n        completed\n        created\n        updated\n      }\n      cursor\n    }\n  }\n}\n"})})}),(0,t.jsx)(s.A,{value:"response",children:(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-json",children:'{\n  "data": {\n    "todoItems": {\n      "pageInfo": {\n        "hasNextPage": false,\n        "hasPreviousPage": false,\n        "startCursor": "YXJyYXljb25uZWN0aW9uOjA=",\n        "endCursor": "YXJyYXljb25uZWN0aW9uOjI="\n      },\n      "edges": [\n        {\n          "node": {\n            "id": "1",\n            "title": "Create One Todo Item",\n            "completed": false,\n            "created": "2020-01-01T00:43:16.000Z",\n            "updated": "2020-01-01T00:43:16.000Z"\n          },\n          "cursor": "YXJyYXljb25uZWN0aW9uOjA="\n        },\n        {\n          "node": {\n            "id": "2",\n            "title": "Create Many Todo Items - 1",\n            "completed": false,\n            "created": "2020-01-01T00:49:01.000Z",\n            "updated": "2020-01-01T00:49:01.000Z"\n          },\n          "cursor": "YXJyYXljb25uZWN0aW9uOjE="\n        },\n        {\n          "node": {\n            "id": "3",\n            "title": "Create Many Todo Items - 2",\n            "completed": true,\n            "created": "2020-01-01T00:49:01.000Z",\n            "updated": "2020-01-01T00:49:01.000Z"\n          },\n          "cursor": "YXJyYXljb25uZWN0aW9uOjI="\n        }\n      ]\n    }\n  }\n}\n'})})})]})]})}function h(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(p,{...e})}):p(e)}},9365:(e,n,r)=>{r.d(n,{A:()=>s});r(6540);var t=r(4164);const a={tabItem:"tabItem_Ymn6"};var l=r(4848);function s(e){var n=e.children,r=e.hidden,s=e.className;return(0,l.jsx)("div",{role:"tabpanel",className:(0,t.A)(a.tabItem,s),hidden:r,children:n})}},1470:(e,n,r)=>{r.d(n,{A:()=>q});var t=r(6540),a=r(4164),l=r(3104),s=r(6347),o=r(205),i=r(7485),u=r(1682),d=r(8760);function c(e){var n,r;return null!=(n=null==(r=t.Children.toArray(e).filter((function(e){return"\n"!==e})).map((function(e){if(!e||(0,t.isValidElement)(e)&&((n=e.props)&&"object"==typeof n&&"value"in n))return e;var n;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})))?void 0:r.filter(Boolean))?n:[]}function p(e){var n=e.values,r=e.children;return(0,t.useMemo)((function(){var e=null!=n?n:function(e){return c(e).map((function(e){var n=e.props;return{value:n.value,label:n.label,attributes:n.attributes,default:n.default}}))}(r);return function(e){var n=(0,u.XI)(e,(function(e,n){return e.value===n.value}));if(n.length>0)throw new Error('Docusaurus error: Duplicate values "'+n.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.')}(e),e}),[n,r])}function h(e){var n=e.value;return e.tabValues.some((function(e){return e.value===n}))}function f(e){var n=e.queryString,r=void 0!==n&&n,a=e.groupId,l=(0,s.W6)(),o=function(e){var n=e.queryString,r=void 0!==n&&n,t=e.groupId;if("string"==typeof r)return r;if(!1===r)return null;if(!0===r&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return null!=t?t:null}({queryString:r,groupId:a});return[(0,i.aZ)(o),(0,t.useCallback)((function(e){if(o){var n=new URLSearchParams(l.location.search);n.set(o,e),l.replace(Object.assign({},l.location,{search:n.toString()}))}}),[o,l])]}function m(e){var n,r,a,l,s=e.defaultValue,i=e.queryString,u=void 0!==i&&i,c=e.groupId,m=p(e),g=(0,t.useState)((function(){return function(e){var n,r=e.defaultValue,t=e.tabValues;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(r){if(!h({value:r,tabValues:t}))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+r+'" but none of its children has the corresponding value. Available values are: '+t.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");return r}var a=null!=(n=t.find((function(e){return e.default})))?n:t[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:s,tabValues:m})})),v=g[0],b=g[1],j=f({queryString:u,groupId:c}),x=j[0],y=j[1],q=(n=function(e){return e?"docusaurus.tab."+e:null}({groupId:c}.groupId),r=(0,d.Dv)(n),a=r[0],l=r[1],[a,(0,t.useCallback)((function(e){n&&l.set(e)}),[n,l])]),I=q[0],T=q[1],w=function(){var e=null!=x?x:I;return h({value:e,tabValues:m})?e:null}();return(0,o.A)((function(){w&&b(w)}),[w]),{selectedValue:v,selectValue:(0,t.useCallback)((function(e){if(!h({value:e,tabValues:m}))throw new Error("Can't select invalid tab value="+e);b(e),y(e),T(e)}),[y,T,m]),tabValues:m}}var g=r(2303);const v={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var b=r(4848);function j(e){var n=e.className,r=e.block,t=e.selectedValue,s=e.selectValue,o=e.tabValues,i=[],u=(0,l.a_)().blockElementScrollPositionUntilNextRender,d=function(e){var n=e.currentTarget,r=i.indexOf(n),a=o[r].value;a!==t&&(u(n),s(a))},c=function(e){var n,r=null;switch(e.key){case"Enter":d(e);break;case"ArrowRight":var t,a=i.indexOf(e.currentTarget)+1;r=null!=(t=i[a])?t:i[0];break;case"ArrowLeft":var l,s=i.indexOf(e.currentTarget)-1;r=null!=(l=i[s])?l:i[i.length-1]}null==(n=r)||n.focus()};return(0,b.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,a.A)("tabs",{"tabs--block":r},n),children:o.map((function(e){var n=e.value,r=e.label,l=e.attributes;return(0,b.jsx)("li",Object.assign({role:"tab",tabIndex:t===n?0:-1,"aria-selected":t===n,ref:function(e){return i.push(e)},onKeyDown:c,onClick:d},l,{className:(0,a.A)("tabs__item",v.tabItem,null==l?void 0:l.className,{"tabs__item--active":t===n}),children:null!=r?r:n}),n)}))})}function x(e){var n=e.lazy,r=e.children,l=e.selectedValue,s=(Array.isArray(r)?r:[r]).filter(Boolean);if(n){var o=s.find((function(e){return e.props.value===l}));return o?(0,t.cloneElement)(o,{className:(0,a.A)("margin-top--md",o.props.className)}):null}return(0,b.jsx)("div",{className:"margin-top--md",children:s.map((function(e,n){return(0,t.cloneElement)(e,{key:n,hidden:e.props.value!==l})}))})}function y(e){var n=m(e);return(0,b.jsxs)("div",{className:(0,a.A)("tabs-container",v.tabList),children:[(0,b.jsx)(j,Object.assign({},n,e)),(0,b.jsx)(x,Object.assign({},n,e))]})}function q(e){var n=(0,g.A)();return(0,b.jsx)(y,Object.assign({},e,{children:c(e.children)}),String(n))}},8453:(e,n,r)=>{r.d(n,{R:()=>s,x:()=>o});var t=r(6540);const a={},l=t.createContext(a);function s(e){const n=t.useContext(l);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:s(e.components),t.createElement(l.Provider,{value:n},e.children)}}}]);