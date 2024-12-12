"use strict";(self.webpackChunknestjs_query=self.webpackChunknestjs_query||[]).push([[1382],{8089:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>u,contentTitle:()=>l,default:()=>p,frontMatter:()=>s,metadata:()=>d,toc:()=>c});var r=n(4848),a=n(8453),o=n(1470),i=n(9365);const s={title:"Relations"},l=void 0,d={id:"persistence/mongoose/relations",title:"Relations",description:"Relations work a little differently in mongoose when compared to other relational ORMs such as sequelize or typescript. You can read more about relations (references) in mongoose here",source:"@site/docs/persistence/mongoose/relations.mdx",sourceDirName:"persistence/mongoose",slug:"/persistence/mongoose/relations",permalink:"/nestjs-query/docs/persistence/mongoose/relations",draft:!1,unlisted:!1,editUrl:"https://github.com/tripss/nestjs-query/edit/master/documentation/docs/persistence/mongoose/relations.mdx",tags:[],version:"current",frontMatter:{title:"Relations"},sidebar:"docs",previous:{title:"Getting Started",permalink:"/nestjs-query/docs/persistence/mongoose/getting-started"},next:{title:"Custom Service",permalink:"/nestjs-query/docs/persistence/mongoose/custom-service"}},u={},c=[{value:"One to Many/Many To One Example",id:"one-to-manymany-to-one-example",level:2},{value:"Many To Many Example",id:"many-to-many-example",level:2}];function m(e){const t={a:"a",admonition:"admonition",code:"code",h2:"h2",p:"p",pre:"pre",...(0,a.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(t.p,{children:["Relations work a little differently in ",(0,r.jsx)(t.code,{children:"mongoose"})," when compared to other relational ORMs such as ",(0,r.jsx)(t.code,{children:"sequelize"})," or ",(0,r.jsx)(t.code,{children:"typescript"}),". You can read more about relations (references) in ",(0,r.jsx)(t.code,{children:"mongoose"})," ",(0,r.jsx)(t.a,{href:"https://mongoosejs.com/docs/populate.html",children:"here"})]}),"\n",(0,r.jsx)(t.admonition,{type:"note",children:(0,r.jsxs)(t.p,{children:["There are multiple ways to set of references in ",(0,r.jsx)(t.code,{children:"mongoose"})," there are intended as starting point."]})}),"\n",(0,r.jsx)(t.admonition,{type:"warning",children:(0,r.jsx)(t.p,{children:"Filtering on references is not supported by mongoose."})}),"\n",(0,r.jsx)(t.h2,{id:"one-to-manymany-to-one-example",children:"One to Many/Many To One Example"}),"\n",(0,r.jsx)(t.p,{children:"To set up a one to many/many to one relationship in mongoose you will store a reference in your document"}),"\n",(0,r.jsxs)(t.p,{children:["For example lets add sub tasks to our todo items by storing a ",(0,r.jsx)(t.code,{children:"todoItem"})," ref on our ",(0,r.jsx)(t.code,{children:"subTask"})]}),"\n",(0,r.jsxs)(o.A,{defaultValue:"todoitem",values:[{label:"TodoItemEntity",value:"todoitem"},{label:"SubTaskEntity",value:"subtask"}],children:[(0,r.jsx)(i.A,{value:"todoitem",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",metastring:'title="todo-item/todo-item.entity.ts" {32-36}',children:"import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';\nimport { SchemaTypes, Types, Document } from 'mongoose';\n\n@Schema({ timestamps: true })\nexport class TodoItemEntity extends Document {\n  @Prop({ required: true })\n  title!: string;\n\n  @Prop()\n  description?: string;\n\n  @Prop({ required: true })\n  completed!: boolean;\n\n  @Prop({ default: Date.now })\n  createdAt!: Date;\n\n  @Prop({ default: Date.now })\n  updatedAt!: Date;\n\n  @Prop({ default: 0 })\n  priority!: number;\n\n  @Prop()\n  createdBy?: string;\n\n  @Prop()\n  updatedBy?: string;\n}\n\nexport const TodoItemEntitySchema = SchemaFactory.createForClass(TodoItemEntity);\nTodoItemEntitySchema.virtual('subTasks', {\n  ref: 'SubTaskEntity',\n  localField: '_id',\n  foreignField: 'todoItem',\n});\n"})})}),(0,r.jsx)(i.A,{value:"subtask",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",metastring:'title="sub-task/sub-task.entity.ts" {15-16}',children:"import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';\nimport { SchemaTypes, Types, Document } from 'mongoose';\n\n@Schema({ timestamps: true })\nexport class SubTaskEntity extends Document {\n  @Prop({ required: true })\n  title!: string;\n\n  @Prop()\n  description?: string;\n\n  @Prop({ required: true })\n  completed!: boolean;\n\n  @Prop({ type: SchemaTypes.ObjectId, ref: 'TodoItemEntity', required: true })\n  todoItem!: Types.ObjectId;\n\n  @Prop()\n  createdAt!: Date;\n\n  @Prop()\n  updatedAt!: Date;\n\n  @Prop()\n  createdBy?: string;\n\n  @Prop()\n  updatedBy?: string;\n}\n\nexport const SubTaskEntitySchema = SchemaFactory.createForClass(SubTaskEntity);\n\n"})})})]}),"\n",(0,r.jsxs)(t.p,{children:["Now that we have the relationship defined we can add the ",(0,r.jsx)(t.code,{children:"@Relation"})," and ",(0,r.jsx)(t.code,{children:"@CursorConnection"})," to our DTOs"]}),"\n",(0,r.jsxs)(o.A,{defaultValue:"todoitem",values:[{label:"TodoItemDTO",value:"todoitem"},{label:"SubTaskDTO",value:"subtask"}],children:[(0,r.jsx)(i.A,{value:"todoitem",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",metastring:'title="todo-item/todo-item.dto.ts"',children:"import { FilterableField, IDField, KeySet, CursorConnection } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType, ID, GraphQLISODateTime, Field } from '@nestjs/graphql';\nimport { SubTaskDTO } from '../../sub-task/dto/sub-task.dto';\n\n@ObjectType('TodoItem')\n@KeySet(['id'])\n// disable the remove because mongoose does not support removing a virtual\n@CursorConnection('subTasks', () => SubTaskDTO, { update: { enabled: true } })\nexport class TodoItemDTO {\n  @IDField(() => ID)\n  id!: string;\n\n  @FilterableField()\n  title!: string;\n\n  @FilterableField({ nullable: true })\n  description?: string;\n\n  @FilterableField()\n  completed!: boolean;\n\n  @FilterableField(() => GraphQLISODateTime)\n  createdAt!: Date;\n\n  @FilterableField(() => GraphQLISODateTime)\n  updatedAt!: Date;\n\n  @Field()\n  age!: number;\n\n  @FilterableField()\n  priority!: number;\n\n  @FilterableField({ nullable: true })\n  createdBy?: string;\n\n  @FilterableField({ nullable: true })\n  updatedBy?: string;\n}\n\n"})})}),(0,r.jsx)(i.A,{value:"subtask",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",metastring:'title="sub-task/sub-task.dto.ts"',children:"import { FilterableField, IDField, KeySet, Relation } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';\nimport { TodoItemDTO } from '../../todo-item/dto/todo-item.dto';\n\n@ObjectType('SubTask')\n@KeySet(['id'])\n// disable the remove because a sub task cannot exist without a todoitem\n@Relation('todoItem', () => TodoItemDTO, { update: { enabled: true } })\nexport class SubTaskDTO {\n  @IDField(() => ID)\n  id!: string;\n\n  @FilterableField()\n  title!: string;\n\n  @FilterableField({ nullable: true })\n  description?: string;\n\n  @FilterableField()\n  completed!: boolean;\n\n  @FilterableField(() => GraphQLISODateTime)\n  createdAt!: Date;\n\n  @FilterableField(() => GraphQLISODateTime)\n  updatedAt!: Date;\n\n  @FilterableField({ nullable: true })\n  createdBy?: string;\n\n  @FilterableField({ nullable: true })\n  updatedBy?: string;\n}\n\n"})})})]}),"\n",(0,r.jsx)(t.h2,{id:"many-to-many-example",children:"Many To Many Example"}),"\n",(0,r.jsxs)(t.p,{children:["In this example we'll add ",(0,r.jsx)(t.code,{children:"tags"})," to ",(0,r.jsx)(t.code,{children:"todoItems"})," by storing an array of ",(0,r.jsx)(t.code,{children:"tag"})," references on the ",(0,r.jsx)(t.code,{children:"todoItems"}),"."]}),"\n",(0,r.jsxs)(o.A,{defaultValue:"todoitem",values:[{label:"TodoItemEntity",value:"todoitem"},{label:"TagEntity",value:"tag"}],children:[(0,r.jsx)(i.A,{value:"todoitem",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",metastring:'title="todo-item/todo-item.entity.ts" {21-23}',children:"import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';\nimport { SchemaTypes, Types, Document } from 'mongoose';\n\n@Schema({ timestamps: true })\nexport class TodoItemEntity extends Document {\n  @Prop({ required: true })\n  title!: string;\n\n  @Prop()\n  description?: string;\n\n  @Prop({ required: true })\n  completed!: boolean;\n\n  @Prop({ default: Date.now })\n  createdAt!: Date;\n\n  @Prop({ default: Date.now })\n  updatedAt!: Date;\n\n  // notice the brackets around the prop options\n  @Prop([{ type: SchemaTypes.ObjectId, ref: 'TagEntity' }])\n  tags!: Types.ObjectId[];\n\n  @Prop({ default: 0 })\n  priority!: number;\n\n  @Prop()\n  createdBy?: string;\n\n  @Prop()\n  updatedBy?: string;\n}\n\nexport const TodoItemEntitySchema = SchemaFactory.createForClass(TodoItemEntity);\n"})})}),(0,r.jsx)(i.A,{value:"tag",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",metastring:'title="tag/tag.entity.ts" {23-27}',children:"import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';\nimport { Document } from 'mongoose';\n\n@Schema({ timestamps: true })\nexport class TagEntity extends Document {\n  @Prop({ required: true })\n  name!: string;\n\n  @Prop()\n  createdAt!: Date;\n\n  @Prop()\n  updatedAt!: Date;\n\n  @Prop()\n  createdBy?: string;\n\n  @Prop()\n  updatedBy?: string;\n}\n\nexport const TagEntitySchema = SchemaFactory.createForClass(TagEntity);\nTagEntitySchema.virtual('todoItems', {\n  ref: 'TodoItemEntity',\n  localField: '_id',\n  foreignField: 'tags',\n});\n\n"})})})]}),"\n",(0,r.jsxs)(t.p,{children:["Now that we have the relationship defined we can add the ",(0,r.jsx)(t.code,{children:"@CursorConnection"})," to our DTOS"]}),"\n",(0,r.jsxs)(o.A,{defaultValue:"todoitem",values:[{label:"TodoItemDTO",value:"todoitem"},{label:"TagDTO",value:"tag"}],children:[(0,r.jsx)(i.A,{value:"todoitem",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",metastring:'title="todo-item/todo-item.dto.ts"',children:"import { FilterableField, IDField, KeySet, CursorConnection } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType, ID, GraphQLISODateTime, Field } from '@nestjs/graphql';\nimport { TagDTO } from '../../tag/dto/tag.dto';\n\n@ObjectType('TodoItem')\n@KeySet(['id'])\n@CursorConnection('tags', () => TagDTO)\nexport class TodoItemDTO {\n  @IDField(() => ID)\n  id!: string;\n\n  @FilterableField()\n  title!: string;\n\n  @FilterableField({ nullable: true })\n  description?: string;\n\n  @FilterableField()\n  completed!: boolean;\n\n  @FilterableField(() => GraphQLISODateTime)\n  createdAt!: Date;\n\n  @FilterableField(() => GraphQLISODateTime)\n  updatedAt!: Date;\n\n  @Field()\n  age!: number;\n\n  @FilterableField()\n  priority!: number;\n\n  @FilterableField({ nullable: true })\n  createdBy?: string;\n\n  @FilterableField({ nullable: true })\n  updatedBy?: string;\n}\n"})})}),(0,r.jsx)(i.A,{value:"tag",children:(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-ts",metastring:'title="tag/tag.dto.ts"',children:"import { FilterableField, IDField, KeySet, CursorConnection } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';\nimport { TodoItemDTO } from '../../todo-item/dto/todo-item.dto';\n\n@ObjectType('Tag')\n@KeySet(['id'])\n// disable update and remove since it is a virtual in the entity\n@CursorConnection('todoItems', () => TodoItemDTO)\nexport class TagDTO {\n  @IDField(() => ID)\n  id!: string;\n\n  @FilterableField()\n  name!: string;\n\n  @FilterableField(() => GraphQLISODateTime)\n  createdAt!: Date;\n\n  @FilterableField(() => GraphQLISODateTime)\n  updatedAt!: Date;\n\n  @FilterableField({ nullable: true })\n  createdBy?: string;\n\n  @FilterableField({ nullable: true })\n  updatedBy?: string;\n}\n"})})})]})]})}function p(e={}){const{wrapper:t}={...(0,a.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(m,{...e})}):m(e)}},9365:(e,t,n)=>{n.d(t,{A:()=>i});n(6540);var r=n(4164);const a={tabItem:"tabItem_Ymn6"};var o=n(4848);function i(e){var t=e.children,n=e.hidden,i=e.className;return(0,o.jsx)("div",{role:"tabpanel",className:(0,r.A)(a.tabItem,i),hidden:n,children:t})}},1470:(e,t,n)=>{n.d(t,{A:()=>j});var r=n(6540),a=n(4164),o=n(3104),i=n(6347),s=n(205),l=n(7485),d=n(1682),u=n(8760);function c(e){var t,n;return null!=(t=null==(n=r.Children.toArray(e).filter((function(e){return"\n"!==e})).map((function(e){if(!e||(0,r.isValidElement)(e)&&((t=e.props)&&"object"==typeof t&&"value"in t))return e;var t;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})))?void 0:n.filter(Boolean))?t:[]}function m(e){var t=e.values,n=e.children;return(0,r.useMemo)((function(){var e=null!=t?t:function(e){return c(e).map((function(e){var t=e.props;return{value:t.value,label:t.label,attributes:t.attributes,default:t.default}}))}(n);return function(e){var t=(0,d.XI)(e,(function(e,t){return e.value===t.value}));if(t.length>0)throw new Error('Docusaurus error: Duplicate values "'+t.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.')}(e),e}),[t,n])}function p(e){var t=e.value;return e.tabValues.some((function(e){return e.value===t}))}function h(e){var t=e.queryString,n=void 0!==t&&t,a=e.groupId,o=(0,i.W6)(),s=function(e){var t=e.queryString,n=void 0!==t&&t,r=e.groupId;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!r)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return null!=r?r:null}({queryString:n,groupId:a});return[(0,l.aZ)(s),(0,r.useCallback)((function(e){if(s){var t=new URLSearchParams(o.location.search);t.set(s,e),o.replace(Object.assign({},o.location,{search:t.toString()}))}}),[s,o])]}function b(e){var t,n,a,o,i=e.defaultValue,l=e.queryString,d=void 0!==l&&l,c=e.groupId,b=m(e),g=(0,r.useState)((function(){return function(e){var t,n=e.defaultValue,r=e.tabValues;if(0===r.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!p({value:n,tabValues:r}))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+n+'" but none of its children has the corresponding value. Available values are: '+r.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");return n}var a=null!=(t=r.find((function(e){return e.default})))?t:r[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:i,tabValues:b})})),y=g[0],f=g[1],v=h({queryString:d,groupId:c}),T=v[0],x=v[1],j=(t=function(e){return e?"docusaurus.tab."+e:null}({groupId:c}.groupId),n=(0,u.Dv)(t),a=n[0],o=n[1],[a,(0,r.useCallback)((function(e){t&&o.set(e)}),[t,o])]),F=j[0],D=j[1],I=function(){var e=null!=T?T:F;return p({value:e,tabValues:b})?e:null}();return(0,s.A)((function(){I&&f(I)}),[I]),{selectedValue:y,selectValue:(0,r.useCallback)((function(e){if(!p({value:e,tabValues:b}))throw new Error("Can't select invalid tab value="+e);f(e),x(e),D(e)}),[x,D,b]),tabValues:b}}var g=n(2303);const y={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var f=n(4848);function v(e){var t=e.className,n=e.block,r=e.selectedValue,i=e.selectValue,s=e.tabValues,l=[],d=(0,o.a_)().blockElementScrollPositionUntilNextRender,u=function(e){var t=e.currentTarget,n=l.indexOf(t),a=s[n].value;a!==r&&(d(t),i(a))},c=function(e){var t,n=null;switch(e.key){case"Enter":u(e);break;case"ArrowRight":var r,a=l.indexOf(e.currentTarget)+1;n=null!=(r=l[a])?r:l[0];break;case"ArrowLeft":var o,i=l.indexOf(e.currentTarget)-1;n=null!=(o=l[i])?o:l[l.length-1]}null==(t=n)||t.focus()};return(0,f.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,a.A)("tabs",{"tabs--block":n},t),children:s.map((function(e){var t=e.value,n=e.label,o=e.attributes;return(0,f.jsx)("li",Object.assign({role:"tab",tabIndex:r===t?0:-1,"aria-selected":r===t,ref:function(e){return l.push(e)},onKeyDown:c,onClick:u},o,{className:(0,a.A)("tabs__item",y.tabItem,null==o?void 0:o.className,{"tabs__item--active":r===t}),children:null!=n?n:t}),t)}))})}function T(e){var t=e.lazy,n=e.children,o=e.selectedValue,i=(Array.isArray(n)?n:[n]).filter(Boolean);if(t){var s=i.find((function(e){return e.props.value===o}));return s?(0,r.cloneElement)(s,{className:(0,a.A)("margin-top--md",s.props.className)}):null}return(0,f.jsx)("div",{className:"margin-top--md",children:i.map((function(e,t){return(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==o})}))})}function x(e){var t=b(e);return(0,f.jsxs)("div",{className:(0,a.A)("tabs-container",y.tabList),children:[(0,f.jsx)(v,Object.assign({},t,e)),(0,f.jsx)(T,Object.assign({},t,e))]})}function j(e){var t=(0,g.A)();return(0,f.jsx)(x,Object.assign({},e,{children:c(e.children)}),String(t))}},8453:(e,t,n)=>{n.d(t,{R:()=>i,x:()=>s});var r=n(6540);const a={},o=r.createContext(a);function i(e){const t=r.useContext(o);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:i(e.components),r.createElement(o.Provider,{value:t},e.children)}}}]);