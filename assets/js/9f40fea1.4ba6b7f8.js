"use strict";(self.webpackChunknestjs_query=self.webpackChunknestjs_query||[]).push([[1656],{3905:(e,t,r)=>{r.d(t,{Zo:()=>a,kt:()=>y});var o=r(7294);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function s(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,o)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?s(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):s(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,o,n=function(e,t){if(null==e)return{};var r,o,n={},s=Object.keys(e);for(o=0;o<s.length;o++)r=s[o],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(o=0;o<s.length;o++)r=s[o],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var p=o.createContext({}),m=function(e){var t=o.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},a=function(e){var t=m(e.components);return o.createElement(p.Provider,{value:t},e.children)},u="mdxType",l={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},d=o.forwardRef((function(e,t){var r=e.components,n=e.mdxType,s=e.originalType,p=e.parentName,a=c(e,["components","mdxType","originalType","parentName"]),u=m(r),d=n,y=u["".concat(p,".").concat(d)]||u[d]||l[d]||s;return r?o.createElement(y,i(i({ref:t},a),{},{components:r})):o.createElement(y,i({ref:t},a))}));function y(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var s=r.length,i=new Array(s);i[0]=d;var c={};for(var p in t)hasOwnProperty.call(t,p)&&(c[p]=t[p]);c.originalType=e,c[u]="string"==typeof e?e:n,i[1]=c;for(var m=2;m<s;m++)i[m]=r[m];return o.createElement.apply(null,i)}return o.createElement.apply(null,r)}d.displayName="MDXCreateElement"},5717:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>a,contentTitle:()=>p,default:()=>y,frontMatter:()=>c,metadata:()=>m,toc:()=>u});var o=r(7462),n=r(3366),s=(r(7294),r(3905)),i=["components"],c={title:"Custom Service"},p=void 0,m={unversionedId:"persistence/typeorm/custom-service",id:"persistence/typeorm/custom-service",title:"Custom Service",description:"To create a custom query service to add your own methods to you can extend the TypeOrmQueryService.",source:"@site/docs/persistence/typeorm/custom-service.md",sourceDirName:"persistence/typeorm",slug:"/persistence/typeorm/custom-service",permalink:"/nestjs-query/docs/persistence/typeorm/custom-service",draft:!1,editUrl:"https://github.com/tripss/nestjs-query/edit/master/documentation/docs/persistence/typeorm/custom-service.md",tags:[],version:"current",frontMatter:{title:"Custom Service"},sidebar:"docs",previous:{title:"Getting Started",permalink:"/nestjs-query/docs/persistence/typeorm/getting-started"},next:{title:"Multiple Databases",permalink:"/nestjs-query/docs/persistence/typeorm/multiple-databases"}},a={},u=[],l={toc:u},d="wrapper";function y(e){var t=e.components,r=(0,n.Z)(e,i);return(0,s.kt)(d,(0,o.Z)({},l,r,{components:t,mdxType:"MDXLayout"}),(0,s.kt)("p",null,"To create a custom query service to add your own methods to you can extend the ",(0,s.kt)("inlineCode",{parentName:"p"},"TypeOrmQueryService"),"."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="todo-item.service.ts"',title:'"todo-item.service.ts"'},"import { QueryService } from '@ptc-org/nestjs-query-core'\nimport { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm';\nimport { InjectRepository } from '@nestjs/typeorm';\nimport { Repository } from 'typeorm';\nimport { TodoItemEntity } from './todo-item.entity';\n\n@QueryService(TodoItemEntity)\nexport class TodoItemService extends TypeOrmQueryService<TodoItemEntity> {\n  constructor(\n    @InjectRepository(TodoItemEntity) repo: Repository<TodoItemEntity>,\n  ) {\n    super(repo);\n  }\n\n  async markAllAsCompleted(): Promise<number> {\n     const entities = await this.query({ filter: { completed: { is: true } } });\n\n     const { updatedCount } = await this.updateMany(\n       { completed: true }, // update\n       { id: { in: entities.map(e => e.id) } } // filter\n     );\n     // do some other business logic\n     return updatedCount;\n  }\n}\n")),(0,s.kt)("p",null,"To use the custom service in the auto-generated resolver you can specify the ",(0,s.kt)("inlineCode",{parentName:"p"},"ServiceClass")," option."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="todo-item.module.ts" {12,16}',title:'"todo-item.module.ts"',"{12,16}":!0},"import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { Module } from '@nestjs/common';\nimport { TodoItemDTO } from './dto/todo-item.dto';\nimport { TodoItemEntity } from './todo-item.entity';\nimport { TodoItemService } from './todo-item.service';\n\n@Module({\n  imports: [\n    NestjsQueryGraphQLModule.forFeature({\n      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],\n      services: [TodoItemService],\n      resolvers: [\n        {\n          DTOClass: TodoItemDTO,\n          ServiceClass: TodoItemService,\n        },\n      ],\n    }),\n  ],\n})\nexport class TodoItemModule {}\n\n")))}y.isMDXComponent=!0}}]);