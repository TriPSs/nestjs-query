"use strict";(self.webpackChunknestjs_query=self.webpackChunknestjs_query||[]).push([[4406],{5346:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>d,contentTitle:()=>o,default:()=>m,frontMatter:()=>l,metadata:()=>c,toc:()=>u});var t=n(4848),s=n(8453),a=n(1470),i=n(9365);const l={title:"Assemblers"},o=void 0,c={id:"concepts/advanced/assemblers",title:"Assemblers",description:"Assemblers are used to translate your DTO into the underlying database type and back.",source:"@site/docs/concepts/advanced/assemblers.mdx",sourceDirName:"concepts/advanced",slug:"/concepts/advanced/assemblers",permalink:"/nestjs-query/docs/concepts/advanced/assemblers",draft:!1,unlisted:!1,editUrl:"https://github.com/tripss/nestjs-query/edit/master/documentation/docs/concepts/advanced/assemblers.mdx",tags:[],version:"current",frontMatter:{title:"Assemblers"},sidebar:"docs",previous:{title:"QueryService",permalink:"/nestjs-query/docs/concepts/services"},next:{title:"Services",permalink:"/nestjs-query/docs/persistence/services"}},d={},u=[{value:"When to use Assemblers",id:"when-to-use-assemblers",level:2},{value:"Why?",id:"why",level:2},{value:"Resolvers",id:"resolvers",level:3},{value:"Services",id:"services",level:3},{value:"Assemblers",id:"assemblers",level:3},{value:"Why not use the assembler in the resolver?",id:"why-not-use-the-assembler-in-the-resolver",level:3},{value:"ClassTransformerAssembler",id:"classtransformerassembler",level:2},{value:"AbstractAssembler",id:"abstractassembler",level:2},{value:"Converting the Query",id:"converting-the-query",level:3},{value:"Converting the DTO",id:"converting-the-dto",level:3},{value:"Converting the Entity",id:"converting-the-entity",level:3},{value:"Converting Aggregate Query",id:"converting-aggregate-query",level:3},{value:"Converting Aggregate Response",id:"converting-aggregate-response",level:3},{value:"Converting Create DTO",id:"converting-create-dto",level:3},{value:"Converting Update DTO",id:"converting-update-dto",level:3},{value:"AssemblerQueryService",id:"assemblerqueryservice",level:2},{value:"Module",id:"module",level:3},{value:"Auto Generated Resolver",id:"auto-generated-resolver",level:3},{value:"Manual Resolver",id:"manual-resolver",level:3}];function h(e){const r={a:"a",code:"code",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(r.p,{children:"Assemblers are used to translate your DTO into the underlying database type and back."}),"\n",(0,t.jsx)(r.h2,{id:"when-to-use-assemblers",children:"When to use Assemblers"}),"\n",(0,t.jsx)(r.p,{children:"In most cases an Assembler will not be required because your Entity and DTO will be the same shape."}),"\n",(0,t.jsx)(r.p,{children:"The only time you need to define an assembler is when the DTO and Entity are different. The most common scenarios are"}),"\n",(0,t.jsxs)(r.ul,{children:["\n",(0,t.jsx)(r.li,{children:"Additional computed fields and you do not want to include the business logic in your DTO definition."}),"\n",(0,t.jsx)(r.li,{children:"Different field names because of poorly named columns in the database or to make a DB change passive to the end user."}),"\n",(0,t.jsx)(r.li,{children:"You need to transform the create or update DTO before being passed to your persistence QueryService"}),"\n"]}),"\n",(0,t.jsx)(r.h2,{id:"why",children:"Why?"}),"\n",(0,t.jsx)(r.p,{children:"Separation of concerns."}),"\n",(0,t.jsx)(r.h3,{id:"resolvers",children:"Resolvers"}),"\n",(0,t.jsx)(r.p,{children:"Your resolvers only concern is dealing with graphql and translating the request (a DTO) into something the service cares about."}),"\n",(0,t.jsxs)(r.p,{children:["The resolver should not care about how it is persisted. The underlying Entity ",(0,t.jsx)(r.strong,{children:"could"})," have additional fields that you do not want to expose in your API, or it may be persisted into multiple stores."]}),"\n",(0,t.jsx)(r.p,{children:"By separating the resolver from the persistence layer you can evolve your API separate from your database model."}),"\n",(0,t.jsx)(r.h3,{id:"services",children:"Services"}),"\n",(0,t.jsx)(r.p,{children:"The services concern are operating on a DTO, preventing the leaking of persistence details to the API."}),"\n",(0,t.jsxs)(r.p,{children:["In ",(0,t.jsx)(r.code,{children:"nestjs-query"})," services can be composed. In the case of assemblers information is translated using the assembler and delegated to an underlying service."]}),"\n",(0,t.jsx)(r.p,{children:"This alleviates any awkwardness around passing in a DTO and receiving a different object type back. Instead, your service can use an assembler to alleviate these concerns."}),"\n",(0,t.jsx)(r.h3,{id:"assemblers",children:"Assemblers"}),"\n",(0,t.jsx)(r.p,{children:"The assembler provides a single, testable, place to provide a translation between the DTO and entity, and vice versa."}),"\n",(0,t.jsx)(r.h3,{id:"why-not-use-the-assembler-in-the-resolver",children:"Why not use the assembler in the resolver?"}),"\n",(0,t.jsx)(r.p,{children:"The resolvers concern is translating graphql requests into the specified DTO."}),"\n",(0,t.jsx)(r.p,{children:"The services concern is accepting and returning a DTO based contract. Then using an assembler to translate between the DTO and underlying entities."}),"\n",(0,t.jsxs)(r.p,{children:["If you follow this pattern you ",(0,t.jsx)(r.strong,{children:"could"})," use the same service with other transports (rest, microservices, etc) as long as the request can be translated into a DTO."]}),"\n",(0,t.jsx)(r.h2,{id:"classtransformerassembler",children:"ClassTransformerAssembler"}),"\n",(0,t.jsxs)(r.p,{children:["In most cases the ",(0,t.jsx)(r.a,{href:"https://github.com/typestack/class-transformer",children:"class-transformer"})," package will properly map back and forth. Because of this there is a ",(0,t.jsx)(r.code,{children:"ClassTransformerAssembler"})," that leverages the ",(0,t.jsx)(r.code,{children:"plainToClass"})," method."]}),"\n",(0,t.jsxs)(r.p,{children:[(0,t.jsx)(r.strong,{children:"NOTE"})," The ",(0,t.jsx)(r.code,{children:"ClassTransformerAssembler"})," is the default implementation if an ",(0,t.jsx)(r.code,{children:"Assembler"})," is not manually defined."]}),"\n",(0,t.jsxs)(r.p,{children:["If you find yourself in a scenario where you need to compute values and you dont want to add the business logic to your DTO you can extend the ",(0,t.jsx)(r.code,{children:"ClassTransformerAssembler"}),"."]}),"\n",(0,t.jsxs)(r.p,{children:["Lets take a simple example, where we have ",(0,t.jsx)(r.code,{children:"TodoItemDTO"})," and we want to compute the ",(0,t.jsx)(r.code,{children:"age"}),"."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="todo-item.assembler.ts"',children:"import { Assembler, ClassTransformerAssembler } from '@ptc-org/nestjs-query-core';\nimport { TodoItemDTO } from './dto/todo-item.dto';\nimport { TodoItemEntity } from './todo-item.entity';\n\n// `@Assembler` decorator will register the assembler with `nestjs-query` and\n// the QueryService service will be able to auto discover it.\n@Assembler(TodoItemDTO, TodoItemEntity)\nexport class TodoItemAssembler extends ClassTransformerAssembler<TodoItemDTO, TodoItemEntity> {\n  convertToDTO(entity: TodoItemEntity): TodoItemDTO {\n    const dto = super.convertToDTO(entity);\n    // compute the age\n    dto.age = Date.now() - entity.created.getMilliseconds();\n    return dto;\n  }\n}\n"})}),"\n",(0,t.jsx)(r.p,{children:"While this example is fairly trivial, the same pattern should apply for more complex scenarios."}),"\n",(0,t.jsx)(r.h2,{id:"abstractassembler",children:"AbstractAssembler"}),"\n",(0,t.jsxs)(r.p,{children:["To create your own ",(0,t.jsx)(r.code,{children:"Assembler"})," extend the ",(0,t.jsx)(r.code,{children:"AbstractAssembler"}),"."]}),"\n",(0,t.jsxs)(r.p,{children:["Lets assume we have the following ",(0,t.jsx)(r.code,{children:"UserDTO"}),"."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="user.dto.ts"',children:"import { FilterableField } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType } from '@nestjs/graphql';\n\n@ObjectType('User')\nclass UserDTO {\n  @FilterableField()\n  firstName!: string;\n\n  @FilterableField()\n  lastName!: string;\n\n  @FilterableField()\n  emailAddress!: string;\n}\n\n"})}),"\n",(0,t.jsx)(r.p,{children:"But you inherited a DB schema that has names that are not as user friendly."}),"\n",(0,t.jsxs)(a.A,{defaultValue:"typeorm",groupId:"orm",values:[{label:"TypeOrm",value:"typeorm"},{label:"Sequelize",value:"sequelize"},{label:"Mongoose",value:"mongoose"}],children:[(0,t.jsx)(i.A,{value:"typeorm",children:(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="user.entity.ts"',children:"import {Entity, Column} from 'typeorm'\n\n@Entity()\nclass UserEntity {\n  @Column()\n  first!: string;\n\n  @Column()\n  last!: string;\n\n  @Column()\n  email!: string;\n}\n"})})}),(0,t.jsx)(i.A,{value:"sequelize",children:(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="user.entity.ts"',children:"import { Table, Column, Model } from 'sequelize-typescript';\n\n@Table\nexport class UserEntity extends Model<UserEntity, Partial<UserEntity>> {\n   @Column\n   first!: string;\n\n   @Column\n   last!: string;\n\n   @Column\n   email!: string;\n}\n\n"})})}),(0,t.jsx)(i.A,{value:"mongoose",children:(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="user.entity.ts"',children:"import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';\nimport { Document } from 'mongoose';\n\n@Schema()\nexport class UserEntity extends Document {\n  @Prop({ required: true })\n  first!: string;\n\n  @Prop({ required: true })\n  last!: string;\n\n  @Prop({ required: true })\n  email!: string;\n}\n\nexport const UserEntityEntitySchema = SchemaFactory.createForClass(UserEntity);\n\n"})})})]}),"\n",(0,t.jsxs)(r.p,{children:["To properly translate the ",(0,t.jsx)(r.code,{children:"UserDTO"})," into the ",(0,t.jsx)(r.code,{children:"UserEntity"})," and back you can extend an ",(0,t.jsx)(r.code,{children:"Assembler"})," that the ",(0,t.jsx)(r.code,{children:"QueryService"})," will use."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="user.assembler.ts"',children:"import {\n  AbstractAssembler,\n  Assembler,\n  Query,\n  transformQuery,\n  transformAggregateQuery,\n  transformAggregateResponse\n} from '@ptc-org/nestjs-query-core';\nimport { UserDTO } from './dto/user.dto';\nimport { UserEntity } from './user.entity';\n\n// `@Assembler` decorator will register the assembler with `nestjs-query` and\n// the QueryService service will be able to auto discover it.\n@Assembler(UserDTO, UserEntity)\nexport class UserAssembler extends AbstractAssembler<UserDTO, UserEntity> {\n  convertQuery(query: Query<UserDTO>): Query<UserEntity> {\n    return transformQuery(query, {\n      firstName: 'first',\n      lastName: 'last',\n      emailAddress: 'email',\n    });\n  }\n\n  convertToDTO(entity: UserEntity): UserDTO {\n    const dto = new UserDTO();\n    dto.firstName = entity.first;\n    dto.lastName = entity.last;\n    return dto;\n  }\n\n  convertToEntity(dto: UserDTO): UserEntity {\n    const entity = new UserEntity();\n    entity.first = dto.firstName;\n    entity.last = dto.lastName;\n    return entity;\n  }\n\n  convertAggregateQuery(aggregate: AggregateQuery<TestDTO>): AggregateQuery<TestEntity> {\n     return transformAggregateQuery(aggregate, {\n       firstName: 'first',\n       lastName: 'last',\n       emailAddress: 'email',\n    });\n  }\n\n  convertAggregateResponse(aggregate: AggregateResponse<TestEntity>): AggregateResponse<TestDTO> {\n    return transformAggregateResponse(aggregate, {\n      first: 'firstName',\n      last: 'lastName',\n      email: 'emailAddress'\n    });\n  }\n\n  convertToCreateEntity({firstName, lastName}: DeepPartial<TestDTO>): DeepPartial<TestEntity> {\n    return {\n      first: firstName,\n      last: lastName,\n    };\n  }\n\n  convertToUpdateEntity({firstName, lastName}: DeepPartial<TestDTO>): DeepPartial<TestEntity> {\n    return {\n      first: firstName,\n      last: lastName,\n    };\n  }\n}\n\n"})}),"\n",(0,t.jsxs)(r.p,{children:["The first thing to look at is the ",(0,t.jsx)(r.code,{children:"@Assembler"})," decorator. It will register the assembler with ",(0,t.jsx)(r.code,{children:"nestjs-query"})," so ",(0,t.jsx)(r.code,{children:"QueryServices"})," can look it up later."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"@Assembler(UserDTO, UserEntity)\n"})}),"\n",(0,t.jsx)(r.h3,{id:"converting-the-query",children:"Converting the Query"}),"\n",(0,t.jsxs)(r.p,{children:["Next the ",(0,t.jsx)(r.code,{children:"convertQuery"})," method."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"convertQuery(query: Query<UserDTO>): Query<UserEntity> {\n  return transformQuery(query, {\n    firstName: 'first',\n    lastName: 'last',\n    emailAddress: 'email',\n  });\n}\n"})}),"\n",(0,t.jsxs)(r.p,{children:["This method leverages the ",(0,t.jsx)(r.code,{children:"transformQuery"})," function from ",(0,t.jsx)(r.code,{children:"@ptc-org/nestjs-query-core"}),". This method will remap all fields specified in the field map to correct field name."]}),"\n",(0,t.jsx)(r.p,{children:"In this example"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"{\n  filter: {\n    firstName: { eq: 'Bob' },\n    lastName: { eq: 'Yukon' },\n    emailAddress: { eq: 'bob@yukon.com' }\n  }\n}\n"})}),"\n",(0,t.jsx)(r.p,{children:"Would be transformed into."}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"{\n  filter: {\n    first: { eq: 'Bob' },\n    last: { eq: 'Yukon' },\n    email: { eq: 'bob@yukon.com' }\n  }\n}\n"})}),"\n",(0,t.jsx)(r.h3,{id:"converting-the-dto",children:"Converting the DTO"}),"\n",(0,t.jsxs)(r.p,{children:["The next piece is the ",(0,t.jsx)(r.code,{children:"convertToDTO"}),", which will convert the entity into a the correct DTO."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"convertToDTO(entity: UserEntity): UserDTO {\n  const dto = new UserDTO();\n  dto.firstName = entity.first;\n  dto.lastName = entity.last;\n  return dto;\n}\n"})}),"\n",(0,t.jsx)(r.h3,{id:"converting-the-entity",children:"Converting the Entity"}),"\n",(0,t.jsxs)(r.p,{children:["The next piece is the ",(0,t.jsx)(r.code,{children:"convertToEntity"}),", which will convert the DTO into a the correct entity."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"convertToEntity(dto: UserDTO): UserEntity {\n  const entity = new UserEntity();\n  entity.first = dto.firstName;\n  entity.last = dto.lastName;\n  return entity;\n}\n"})}),"\n",(0,t.jsx)(r.h3,{id:"converting-aggregate-query",children:"Converting Aggregate Query"}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"convertAggregateQuery"})," is used to convert an ",(0,t.jsx)(r.code,{children:"AggregateQuery"}),". This examples uses the ",(0,t.jsx)(r.code,{children:"transformAggregateQuery"})," helper to map aggregate query fields."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"convertAggregateQuery(aggregate: AggregateQuery<TestDTO>): AggregateQuery<TestEntity> {\n   return transformAggregateQuery(aggregate, {\n     firstName: 'first',\n     lastName: 'last',\n     emailAddress: 'email',\n  });\n}\n"})}),"\n",(0,t.jsx)(r.h3,{id:"converting-aggregate-response",children:"Converting Aggregate Response"}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"convertAggregateResponse"})," is used to convert an ",(0,t.jsx)(r.code,{children:"AggregateResponse"}),". This examples uses the ",(0,t.jsx)(r.code,{children:"transformAggregateResponse"})," helper to map aggregate response fields."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"convertAggregateResponse(aggregate: AggregateResponse<TestEntity>): AggregateResponse<TestDTO> {\n  return transformAggregateResponse(aggregate, {\n    first: 'firstName',\n    last: 'lastName',\n    email: 'emailAddress'\n  });\n}\n"})}),"\n",(0,t.jsx)(r.h3,{id:"converting-create-dto",children:"Converting Create DTO"}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"convertToCreateEntity"})," is used to convert an incoming create DTO to the appropriate create entity, in this case\npartial."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"convertToCreateEntity({firstName, lastName}: DeepPartial<TestDTO>): DeepPartial<TestEntity> {\n  return {\n    first: firstName,\n    last: lastName,\n  };\n}\n"})}),"\n",(0,t.jsx)(r.h3,{id:"converting-update-dto",children:"Converting Update DTO"}),"\n",(0,t.jsxs)(r.p,{children:["The ",(0,t.jsx)(r.code,{children:"convertToUpdateEntity"})," is used to convert an incoming update DTO to the appropriate update entity, in this case a\npartial."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",children:"convertToUpdateEntity({firstName, lastName}: DeepPartial<TestDTO>): DeepPartial<TestEntity> {\n  return {\n    first: firstName,\n    last: lastName,\n  };\n}\n"})}),"\n",(0,t.jsx)(r.p,{children:"This is a pretty basic example but the same pattern should apply to more complex scenarios."}),"\n",(0,t.jsx)(r.h2,{id:"assemblerqueryservice",children:"AssemblerQueryService"}),"\n",(0,t.jsxs)(r.p,{children:["An ",(0,t.jsx)(r.code,{children:"AssemblerQueryService"})," is a special type of ",(0,t.jsx)(r.code,{children:"QueryService"})," that uses the Assembler to translate between the DTO and Entity."]}),"\n",(0,t.jsxs)(r.p,{children:["The easiest way to create an ",(0,t.jsx)(r.code,{children:"AssemblerQueryService"})," is to use the ",(0,t.jsx)(r.code,{children:"@InjectAssemblerQueryService"})," decorator."]}),"\n",(0,t.jsxs)(r.p,{children:["Before using the decorator you need to register your Assembler with ",(0,t.jsx)(r.code,{children:"nestjs-query"})]}),"\n",(0,t.jsx)(r.h3,{id:"module",children:"Module"}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="user.module.ts" {10}',children:"import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { Module } from '@nestjs/common';\nimport { UserDTO } from './user.dto';\n\n@Module({\n  providers: [TodoItemResolver],\n  imports: [\n    NestjsQueryGraphQLModule.forFeature({\n      imports: [ /* set up your entity with a nestjs-query persitence package */],\n      assemblers: [UserAssembler],\n      resolvers: [ ],\n    }),\n  ],\n})\nexport class UserModule {}\n\n"})}),"\n",(0,t.jsx)(r.h3,{id:"auto-generated-resolver",children:"Auto Generated Resolver"}),"\n",(0,t.jsxs)(r.p,{children:["If you want your assembler to be used by the auto-generated resolver you can specify the ",(0,t.jsx)(r.code,{children:"AssemblerClass"})," option."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="user.module.ts" {10,14}',children:"import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { Module } from '@nestjs/common';\nimport { UserDTO } from './user.dto';\n\n@Module({\n  providers: [TodoItemResolver],\n  imports: [\n    NestjsQueryGraphQLModule.forFeature({\n      imports: [ /* set up your entity with a nestjs-query persitence package */],\n      assemblers: [UserAssembler],\n      resolvers: [\n        {\n          DTOClass: UserDTO,\n          AssemblerClass: UserAssembler\n        }\n      ],\n    }),\n  ],\n})\nexport class UserModule {}\n\n"})}),"\n",(0,t.jsx)(r.h3,{id:"manual-resolver",children:"Manual Resolver"}),"\n",(0,t.jsxs)(r.p,{children:["If you are manually defining you resolver or want to use the ",(0,t.jsx)(r.code,{children:"AssemblerQueryService"})," in another service use the ",(0,t.jsx)(r.code,{children:"@InjectAssemblerQueryService"})," decorator."]}),"\n",(0,t.jsx)(r.pre,{children:(0,t.jsx)(r.code,{className:"language-ts",metastring:'title="user.resolver.ts" {8}',children:"import { CRUDResolver } from '@ptc-org/nestjs-query-graphql';\nimport { Resolver } from '@nestjs/graphql';\nimport { UserDTO } from './user.dto';\nimport { UserAssembler } from './user.assembler'\n\n@Resolver(() => UserDTO)\nexport class UserResolver extends CRUDResolver(UserDTO) {\n  constructor(@InjectAssemblerQueryService(UserAssembler) readonly service: QueryService<UserDTO>) {\n    super(service);\n  }\n}\n"})}),"\n",(0,t.jsxs)(r.p,{children:["Notice ",(0,t.jsx)(r.code,{children:"QueryService<UserDTO>"}),"."]})]})}function m(e={}){const{wrapper:r}={...(0,s.R)(),...e.components};return r?(0,t.jsx)(r,{...e,children:(0,t.jsx)(h,{...e})}):h(e)}},9365:(e,r,n)=>{n.d(r,{A:()=>i});n(6540);var t=n(4164);const s={tabItem:"tabItem_Ymn6"};var a=n(4848);function i(e){var r=e.children,n=e.hidden,i=e.className;return(0,a.jsx)("div",{role:"tabpanel",className:(0,t.A)(s.tabItem,i),hidden:n,children:r})}},1470:(e,r,n)=>{n.d(r,{A:()=>T});var t=n(6540),s=n(4164),a=n(3104),i=n(6347),l=n(205),o=n(7485),c=n(1682),d=n(8760);function u(e){var r,n;return null!=(r=null==(n=t.Children.toArray(e).filter((function(e){return"\n"!==e})).map((function(e){if(!e||(0,t.isValidElement)(e)&&((r=e.props)&&"object"==typeof r&&"value"in r))return e;var r;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})))?void 0:n.filter(Boolean))?r:[]}function h(e){var r=e.values,n=e.children;return(0,t.useMemo)((function(){var e=null!=r?r:function(e){return u(e).map((function(e){var r=e.props;return{value:r.value,label:r.label,attributes:r.attributes,default:r.default}}))}(n);return function(e){var r=(0,c.XI)(e,(function(e,r){return e.value===r.value}));if(r.length>0)throw new Error('Docusaurus error: Duplicate values "'+r.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.')}(e),e}),[r,n])}function m(e){var r=e.value;return e.tabValues.some((function(e){return e.value===r}))}function p(e){var r=e.queryString,n=void 0!==r&&r,s=e.groupId,a=(0,i.W6)(),l=function(e){var r=e.queryString,n=void 0!==r&&r,t=e.groupId;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return null!=t?t:null}({queryString:n,groupId:s});return[(0,o.aZ)(l),(0,t.useCallback)((function(e){if(l){var r=new URLSearchParams(a.location.search);r.set(l,e),a.replace(Object.assign({},a.location,{search:r.toString()}))}}),[l,a])]}function g(e){var r,n,s,a,i=e.defaultValue,o=e.queryString,c=void 0!==o&&o,u=e.groupId,g=h(e),v=(0,t.useState)((function(){return function(e){var r,n=e.defaultValue,t=e.tabValues;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!m({value:n,tabValues:t}))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+n+'" but none of its children has the corresponding value. Available values are: '+t.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");return n}var s=null!=(r=t.find((function(e){return e.default})))?r:t[0];if(!s)throw new Error("Unexpected error: 0 tabValues");return s.value}({defaultValue:i,tabValues:g})})),y=v[0],f=v[1],b=p({queryString:c,groupId:u}),j=b[0],x=b[1],T=(r=function(e){return e?"docusaurus.tab."+e:null}({groupId:u}.groupId),n=(0,d.Dv)(r),s=n[0],a=n[1],[s,(0,t.useCallback)((function(e){r&&a.set(e)}),[r,a])]),A=T[0],D=T[1],O=function(){var e=null!=j?j:A;return m({value:e,tabValues:g})?e:null}();return(0,l.A)((function(){O&&f(O)}),[O]),{selectedValue:y,selectValue:(0,t.useCallback)((function(e){if(!m({value:e,tabValues:g}))throw new Error("Can't select invalid tab value="+e);f(e),x(e),D(e)}),[x,D,g]),tabValues:g}}var v=n(2303);const y={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var f=n(4848);function b(e){var r=e.className,n=e.block,t=e.selectedValue,i=e.selectValue,l=e.tabValues,o=[],c=(0,a.a_)().blockElementScrollPositionUntilNextRender,d=function(e){var r=e.currentTarget,n=o.indexOf(r),s=l[n].value;s!==t&&(c(r),i(s))},u=function(e){var r,n=null;switch(e.key){case"Enter":d(e);break;case"ArrowRight":var t,s=o.indexOf(e.currentTarget)+1;n=null!=(t=o[s])?t:o[0];break;case"ArrowLeft":var a,i=o.indexOf(e.currentTarget)-1;n=null!=(a=o[i])?a:o[o.length-1]}null==(r=n)||r.focus()};return(0,f.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,s.A)("tabs",{"tabs--block":n},r),children:l.map((function(e){var r=e.value,n=e.label,a=e.attributes;return(0,f.jsx)("li",Object.assign({role:"tab",tabIndex:t===r?0:-1,"aria-selected":t===r,ref:function(e){return o.push(e)},onKeyDown:u,onClick:d},a,{className:(0,s.A)("tabs__item",y.tabItem,null==a?void 0:a.className,{"tabs__item--active":t===r}),children:null!=n?n:r}),r)}))})}function j(e){var r=e.lazy,n=e.children,a=e.selectedValue,i=(Array.isArray(n)?n:[n]).filter(Boolean);if(r){var l=i.find((function(e){return e.props.value===a}));return l?(0,t.cloneElement)(l,{className:(0,s.A)("margin-top--md",l.props.className)}):null}return(0,f.jsx)("div",{className:"margin-top--md",children:i.map((function(e,r){return(0,t.cloneElement)(e,{key:r,hidden:e.props.value!==a})}))})}function x(e){var r=g(e);return(0,f.jsxs)("div",{className:(0,s.A)("tabs-container",y.tabList),children:[(0,f.jsx)(b,Object.assign({},r,e)),(0,f.jsx)(j,Object.assign({},r,e))]})}function T(e){var r=(0,v.A)();return(0,f.jsx)(x,Object.assign({},e,{children:u(e.children)}),String(r))}},8453:(e,r,n)=>{n.d(r,{R:()=>i,x:()=>l});var t=n(6540);const s={},a=t.createContext(s);function i(e){const r=t.useContext(a);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function l(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:i(e.components),t.createElement(a.Provider,{value:r},e.children)}}}]);