"use strict";(self.webpackChunknestjs_query=self.webpackChunknestjs_query||[]).push([[860],{3660:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>a,default:()=>p,frontMatter:()=>s,metadata:()=>d,toc:()=>u});var r=t(4848),o=t(8453),l=t(1470),i=t(9365);const s={title:"Services"},a=void 0,d={id:"persistence/services",title:"Services",description:"@nestjs-query provides a common interface to use different ORMs in order to query and mutate your data.",source:"@site/docs/persistence/services.mdx",sourceDirName:"persistence",slug:"/persistence/services",permalink:"/nestjs-query/docs/persistence/services",draft:!1,unlisted:!1,editUrl:"https://github.com/tripss/nestjs-query/edit/master/documentation/docs/persistence/services.mdx",tags:[],version:"current",frontMatter:{title:"Services"},sidebar:"docs",previous:{title:"Assemblers",permalink:"/nestjs-query/docs/concepts/advanced/assemblers"},next:{title:"Getting Started",permalink:"/nestjs-query/docs/persistence/typeorm/getting-started"}},c={},u=[{value:"Creating a Service",id:"creating-a-service",level:2},{value:"Module",id:"module",level:3},{value:"Decorator",id:"decorator",level:3},{value:"Querying",id:"querying",level:2},{value:"Example",id:"example",level:4},{value:"Filtering",id:"filtering",level:3},{value:"Example",id:"example-1",level:4},{value:"Sorting",id:"sorting",level:3},{value:"Example",id:"example-2",level:4},{value:"Paging",id:"paging",level:3},{value:"Example",id:"example-3",level:4},{value:"Find By Id",id:"find-by-id",level:3},{value:"Example",id:"example-4",level:4},{value:"Get By Id",id:"get-by-id",level:3},{value:"Example",id:"example-5",level:4},{value:"Aggregating",id:"aggregating",level:3},{value:"Creating",id:"creating",level:2},{value:"Create One",id:"create-one",level:3},{value:"Example",id:"example-6",level:4},{value:"Create Many",id:"create-many",level:3},{value:"Example",id:"example-7",level:4},{value:"Updating",id:"updating",level:2},{value:"Update One",id:"update-one",level:3},{value:"Example",id:"example-8",level:4},{value:"Update Many",id:"update-many",level:3},{value:"Example",id:"example-9",level:4},{value:"Deleting",id:"deleting",level:2},{value:"Delete One",id:"delete-one",level:3},{value:"Example",id:"example-10",level:4},{value:"Delete Many",id:"delete-many",level:3},{value:"Example",id:"example-11",level:4},{value:"Foreign Keys",id:"foreign-keys",level:2},{value:"Example",id:"example-12",level:3},{value:"Relations",id:"relations",level:2},{value:"Example",id:"example-13",level:3}];function m(e){const n={a:"a",admonition:"admonition",code:"code",h2:"h2",h3:"h3",h4:"h4",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.code,{children:"@nestjs-query"})," provides a common interface to use different ORMs in order to query and mutate your data."]}),"\n",(0,r.jsx)(n.p,{children:"The following ORMs are supported out of the box."}),"\n",(0,r.jsxs)(n.ul,{children:["\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"/nestjs-query/docs/persistence/typeorm/getting-started",children:"TypeOrm"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"/nestjs-query/docs/persistence/sequelize/getting-started",children:"Sequelize"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"/nestjs-query/docs/persistence/mongoose/getting-started",children:"Mongoose"})}),"\n",(0,r.jsx)(n.li,{children:(0,r.jsx)(n.a,{href:"/nestjs-query/docs/persistence/typegoose/getting-started",children:"Typegoose"})}),"\n"]}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.code,{children:"@ptc-org/nestjs-query-core"})," also provides a number of base ",(0,r.jsx)(n.code,{children:"QueryService"}),"s that can be used to create custom query services.\n",(0,r.jsx)(n.a,{href:"/nestjs-query/docs/concepts/services#service-helpers",children:"See the Services docs"})]}),"\n",(0,r.jsx)(n.p,{children:"All examples assume the following entity."}),"\n",(0,r.jsxs)(l.A,{defaultValue:"typeorm",groupId:"orm",values:[{label:"TypeOrm",value:"typeorm"},{label:"Sequelize",value:"sequelize"},{label:"Mongoose",value:"mongoose"},{label:"Typegoose",value:"typegoose"}],children:[(0,r.jsx)(i.A,{value:"typeorm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.entity.ts"',children:"import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';\n\n@Entity()\nexport class TodoItemEntity {\n  @PrimaryGeneratedColumn()\n  id!: string;\n\n  @Column()\n  title!: string;\n\n  @Column()\n  completed!: boolean;\n\n  @CreateDateColumn()\n  created!: Date;\n\n  @UpdateDateColumn()\n  updated!: Date;\n}\n"})})}),(0,r.jsx)(i.A,{value:"sequelize",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.entity.ts"',children:"import {\n  Table,\n  Column,\n  Model,\n  AllowNull,\n  CreatedAt,\n  UpdatedAt,\n  PrimaryKey,\n  AutoIncrement,\n} from 'sequelize-typescript';\n\n@Table\nexport class TodoItemEntity extends Model<TodoItemEntity, Partial<TodoItemEntity>> {\n  @PrimaryKey\n  @AutoIncrement\n  @Column\n  id!: number;\n\n  @Column\n  title!: string;\n\n  @AllowNull\n  @Column\n  description?: string;\n\n  @Column\n  completed!: boolean;\n\n  @CreatedAt\n  created!: Date;\n\n  @UpdatedAt\n  updated!: Date;\n}\n"})})}),(0,r.jsx)(i.A,{value:"mongoose",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.entity.ts"',children:"import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';\nimport { Document } from 'mongoose';\n\n@Schema({ timestamps: { createdAt: 'created', updatedAt: 'updated' } })\nexport class TodoItemEntity extends Document {\n  @Prop({ required: true })\n  title!: string;\n\n  @Prop()\n  description?: string;\n\n  @Prop({ required: true })\n  completed!: boolean;\n\n  @Prop({ default: Date.now })\n  created!: Date;\n\n  @Prop({ default: Date.now })\n  updated!: Date;\n}\n\nexport const TodoItemEntitySchema = SchemaFactory.createForClass(TodoItemEntity);\n"})})}),(0,r.jsx)(i.A,{value:"typegoose",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.entity.ts"',children:"import { ObjectId } from '@ptc-org/nestjs-query-graphql'\nimport { Base } from '@typegoose/typegoose/lib/defaultClasses';\nimport { Prop, modelOptions, Ref } from '@typegoose/typegoose';\nimport { Types } from 'mongoose';\nimport { SubTaskEntity } from '../sub-task/sub-task.entity';\nimport { TagEntity } from '../tag/tag.entity';\n\n@modelOptions({\n  schemaOptions: {\n    timestamps: { createdAt: 'created', updatedAt: 'updated' },\n    collection: 'todo-items',\n    toObject: { virtuals: true },\n  },\n})\nexport class TodoItemEntity implements Base {\n  @ObjectId()\n  _id!: Types.ObjectId\n\n  id!: string  \n\n  @Prop({ required: true })\n  title!: string;\n\n  @Prop()\n  description?: string;\n\n  @Prop({ required: true })\n  completed!: boolean;\n\n  @Prop({ default: Date.now })\n  created!: Date;\n\n  @Prop({ default: Date.now })\n  updated!: Date;\n}\n\n"})})})]}),"\n",(0,r.jsx)(n.h2,{id:"creating-a-service",children:"Creating a Service"}),"\n",(0,r.jsx)(n.h3,{id:"module",children:"Module"}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"nestjs-query"})," ",(0,r.jsx)(n.code,{children:"typeorm"}),", ",(0,r.jsx)(n.code,{children:"sequelize"}),", ",(0,r.jsx)(n.code,{children:"mongoose"}),", and ",(0,r.jsx)(n.code,{children:"typegoose"})," packages provide a module that will add providers\nto inject auto-created ",(0,r.jsx)(n.code,{children:"QueryServices"})," using the ",(0,r.jsx)(n.code,{children:"@InjectQueryService"})," decorator."]}),"\n",(0,r.jsxs)(n.p,{children:["In order to use the decorator you will need to use the module that comes with the ",(0,r.jsx)(n.code,{children:"nestjs-query"})," orm module providing it your entities that you want the services created for."]}),"\n",(0,r.jsxs)(l.A,{defaultValue:"typeorm",groupId:"orm",values:[{label:"TypeOrm",value:"typeorm"},{label:"Sequelize",value:"sequelize"},{label:"Mongoose",value:"mongoose"},{label:"Typegoose",value:"typegoose"}],children:[(0,r.jsx)(i.A,{value:"typeorm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.module.ts" {8}',children:"import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { Module } from '@nestjs/common';\nimport { TodoItemEntity } from './todo-item.entity';\nimport { TodoItemResolver } from './todo-item.resolver';\n\n@Module({\n  providers: [TodoItemResolver],\n  imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],\n})\nexport class TodoItemModule {}\n\n"})})}),(0,r.jsx)(i.A,{value:"sequelize",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.module.ts" {8}',children:"import { NestjsQuerySequelizeModule } from '@ptc-org/nestjs-query-sequelize';\nimport { Module } from '@nestjs/common';\nimport { TodoItemEntity } from './todo-item.entity';\nimport { TodoItemResolver } from './todo-item.resolver';\n\n@Module({\n  providers: [TodoItemResolver],\n  imports: [NestjsQuerySequelizeModule.forFeature([TodoItemEntity])],\n})\nexport class TodoItemModule {}\n"})})}),(0,r.jsx)(i.A,{value:"mongoose",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.module.ts" {9-11}',children:"import { NestjsQueryMongooseModule } from '@ptc-org/nestjs-query-mongoose';\nimport { Module } from '@nestjs/common';\nimport { TodoItemEntity } from './todo-item.entity';\nimport { TodoItemResolver } from './todo-item.resolver';\n\n@Module({\n  providers: [TodoItemResolver],\n  imports: [\n    NestjsQueryMongooseModule.forFeature([\n      { document: TodoItemEntity, name: TodoItemEntity.name, schema: TodoItemEntitySchema },\n    ]),\n  ],\n})\nexport class TodoItemModule {}\n"})})}),(0,r.jsx)(i.A,{value:"typegoose",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.module.ts" {8}',children:"import { NestjsQueryTypegooseModule } from '@ptc-org/nestjs-query-typegoose';\nimport { Module } from '@nestjs/common';\nimport { TodoItemEntity } from './todo-item.entity';\nimport { TodoItemResolver } from './todo-item.resolver';\n\n@Module({\n  providers: [TodoItemResolver],\n  imports: [NestjsQueryTypegooseModule.forFeature([TodoItemEntity])],\n})\nexport class TodoItemModule {}\n"})})})]}),"\n",(0,r.jsx)(n.h3,{id:"decorator",children:"Decorator"}),"\n",(0,r.jsxs)(n.p,{children:["Once you have imported the correct module, use ",(0,r.jsx)(n.code,{children:"@InjectQueryService"})," decorator to inject a ",(0,r.jsx)(n.code,{children:"QueryService"})," into your class or resolver."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="todo-item.resolver.ts" {10}',children:"import { QueryService, InjectQueryService } from '@ptc-org/nestjs-query-core';\nimport { CRUDResolver } from '@ptc-org/nestjs-query-graphql';\nimport { Resolver } from '@nestjs/graphql';\nimport { TodoItemDTO } from './todo-item.dto';\nimport { TodoItemEntity } from './todo-item.entity';\n\n@Resolver(() => TodoItemDTO)\nexport class TodoItemResolver extends CRUDResolver(TodoItemDTO) {\n  constructor(\n    @InjectQueryService(TodoItemEntity) readonly service: QueryService<TodoItemEntity>\n  ) {\n    super(service);\n  }\n}\n"})}),"\n",(0,r.jsx)(n.admonition,{type:"note",children:(0,r.jsxs)(n.p,{children:["The above resolver is an example of manually defining the resolver, if you use the ",(0,r.jsx)(n.code,{children:"NestjsQueryGraphQLModule"})," you do not need to define a resolver."]})}),"\n",(0,r.jsx)(n.admonition,{type:"note",children:(0,r.jsxs)(n.p,{children:["In the above example the DTO and entity are the same shape, if you have a case where they are different or have\ncomputed fields check out ",(0,r.jsx)(n.a,{href:"/nestjs-query/docs/concepts/advanced/assemblers",children:"Assemblers"})," to understand how to convert to and from\nthe\nDTO/Entity."]})}),"\n",(0,r.jsx)(n.h2,{id:"querying",children:"Querying"}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"nestjs-query"})," QueryService uses a common ",(0,r.jsx)(n.code,{children:"Query"})," interface that allows you use a common type regardless of the persistence library in use."]}),"\n",(0,r.jsxs)(n.p,{children:["To query for records from your service you can use the ",(0,r.jsx)(n.code,{children:"query"})," method which will return a ",(0,r.jsx)(n.code,{children:"Promise"})," of an array of\nentities. To read more about querying take a look at the ",(0,r.jsx)(n.a,{href:"/nestjs-query/docs/concepts/queries",children:"Queries Doc"}),"."]}),"\n",(0,r.jsx)(n.h4,{id:"example",children:"Example"}),"\n",(0,r.jsx)(n.p,{children:"Get all records"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const records = await this.service.query({});\n"})}),"\n",(0,r.jsx)(n.h3,{id:"filtering",children:"Filtering"}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"filter"})," option is translated to a ",(0,r.jsx)(n.code,{children:"WHERE"})," clause."]}),"\n",(0,r.jsx)(n.h4,{id:"example-1",children:"Example"}),"\n",(0,r.jsxs)(n.p,{children:["To find all completed ",(0,r.jsx)(n.code,{children:"TodoItems"})," by use can use the ",(0,r.jsx)(n.code,{children:"is"})," operator."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const records = await this.service.query({\n   filter : {\n     completed: { is: true },\n   },\n});\n"})}),"\n",(0,r.jsx)(n.h3,{id:"sorting",children:"Sorting"}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"sorting"})," option is translated to a ",(0,r.jsx)(n.code,{children:"ORDER BY"}),"."]}),"\n",(0,r.jsx)(n.h4,{id:"example-2",children:"Example"}),"\n",(0,r.jsxs)(n.p,{children:["Sorting records by ",(0,r.jsx)(n.code,{children:"completed"})," and ",(0,r.jsx)(n.code,{children:"title"}),"."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const records = await this.service.query({\n  sorting: [\n    {field: 'completed', direction: SortDirection.ASC},\n    {field: 'title', direction: SortDirection.DESC},\n  ],\n});\n"})}),"\n",(0,r.jsx)(n.h3,{id:"paging",children:"Paging"}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"paging"})," option is translated to ",(0,r.jsx)(n.code,{children:"LIMIT"})," and ",(0,r.jsx)(n.code,{children:"OFFSET"}),"."]}),"\n",(0,r.jsx)(n.h4,{id:"example-3",children:"Example"}),"\n",(0,r.jsx)(n.p,{children:"Skip the first 20 records and return the next 10."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const records = await this.service.query({\n  paging: {limit: 10, offset: 20},\n});\n"})}),"\n",(0,r.jsx)(n.h3,{id:"find-by-id",children:"Find By Id"}),"\n",(0,r.jsxs)(n.p,{children:["To find a single record you can use the ",(0,r.jsx)(n.code,{children:"findById"})," method."]}),"\n",(0,r.jsx)(n.h4,{id:"example-4",children:"Example"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const records = await this.service.findById(1);\n"})}),"\n",(0,r.jsx)(n.h3,{id:"get-by-id",children:"Get By Id"}),"\n",(0,r.jsxs)(n.p,{children:["The ",(0,r.jsx)(n.code,{children:"getById"})," method is the same as the ",(0,r.jsx)(n.code,{children:"findById"})," with one key difference, it will throw an exception if the record is not found."]}),"\n",(0,r.jsx)(n.h4,{id:"example-5",children:"Example"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"try {\n  const records = await this.service.getById(1);\n} catch (e) {\n  console.error('Unable to get record with id = 1');\n}\n"})}),"\n",(0,r.jsx)(n.h3,{id:"aggregating",children:"Aggregating"}),"\n",(0,r.jsxs)(n.p,{children:["To perform an ",(0,r.jsx)(n.code,{children:"aggregate"})," query you can use the ",(0,r.jsx)(n.code,{children:"aggregate"})," method which accepts a ",(0,r.jsx)(n.code,{children:"Filter"})," and ",(0,r.jsx)(n.code,{children:"AggregateQuery"}),"."]}),"\n",(0,r.jsxs)(n.p,{children:["Supported aggregates are ",(0,r.jsx)(n.code,{children:"count"}),", ",(0,r.jsx)(n.code,{children:"sum"}),", ",(0,r.jsx)(n.code,{children:"avg"}),", ",(0,r.jsx)(n.code,{children:"min"})," and ",(0,r.jsx)(n.code,{children:"max"}),"."]}),"\n",(0,r.jsx)(n.p,{children:"In this example we'll aggregate on all records."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const aggregateResponse = await this.service.aggregate({}, {\n    count: ['id'],\n    min: ['title'],\n    max: ['title']\n});\n"})}),"\n",(0,r.jsx)(n.p,{children:"The response will look like the following"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"[\n  {\n    count: {\n      id: 10\n    },\n    min: {\n      title: 'Aggregate Todo Items'\n    },\n    min: {\n      title: 'Query Todo Items'\n    },\n  }\n]\n"})}),"\n",(0,r.jsx)(n.p,{children:"In this example we'll aggregate on all completed TodoItems"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const aggregateResponse = await this.service.aggregate({ completed: { is: true } }, {\n    count: ['id'],\n    min: ['title'],\n    max: ['title']\n});\n"})}),"\n",(0,r.jsx)(n.h2,{id:"creating",children:"Creating"}),"\n",(0,r.jsx)(n.h3,{id:"create-one",children:"Create One"}),"\n",(0,r.jsxs)(n.p,{children:["To create a single record use the ",(0,r.jsx)(n.code,{children:"createOne"})," method."]}),"\n",(0,r.jsx)(n.h4,{id:"example-6",children:"Example"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const createdRecord = await this.service.createOne({\n  title: 'Foo',\n  completed: false,\n});\n"})}),"\n",(0,r.jsx)(n.h3,{id:"create-many",children:"Create Many"}),"\n",(0,r.jsxs)(n.p,{children:["To create multiple records use the ",(0,r.jsx)(n.code,{children:"createMany"})," method."]}),"\n",(0,r.jsx)(n.h4,{id:"example-7",children:"Example"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const createdRecords = await this.service.createMany([\n  { title: 'Foo', completed: false },\n  { title: 'Bar', completed: true },\n]);\n"})}),"\n",(0,r.jsx)(n.h2,{id:"updating",children:"Updating"}),"\n",(0,r.jsx)(n.h3,{id:"update-one",children:"Update One"}),"\n",(0,r.jsxs)(n.p,{children:["To update a single record use the ",(0,r.jsx)(n.code,{children:"updateOne"})," method."]}),"\n",(0,r.jsx)(n.h4,{id:"example-8",children:"Example"}),"\n",(0,r.jsx)(n.p,{children:"Updates the record with an id equal to 1 to completed."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const updatedRecord = await this.service.updateOne(1, { completed: true });\n"})}),"\n",(0,r.jsx)(n.h3,{id:"update-many",children:"Update Many"}),"\n",(0,r.jsxs)(n.p,{children:["To update multiple records use the ",(0,r.jsx)(n.code,{children:"updateMany"})," method."]}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.strong,{children:"NOTE"})," This method returns a ",(0,r.jsx)(n.code,{children:"UpdateManyResponse"})," which contains the updated record count."]}),"\n",(0,r.jsx)(n.h4,{id:"example-9",children:"Example"}),"\n",(0,r.jsxs)(n.p,{children:["Updates all ",(0,r.jsx)(n.code,{children:"TodoItemEntities"})," to completed if their title ends in ",(0,r.jsx)(n.code,{children:"Bar"})]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const { updatedCount } = await this.service.updateMany(\n  {completed: true}, // update\n  {completed: {is: false}, title: {like: '%Bar'}} // filter\n);\n"})}),"\n",(0,r.jsx)(n.h2,{id:"deleting",children:"Deleting"}),"\n",(0,r.jsx)(n.h3,{id:"delete-one",children:"Delete One"}),"\n",(0,r.jsxs)(n.p,{children:["To delete a single record use the ",(0,r.jsx)(n.code,{children:"deleteOne"})," method."]}),"\n",(0,r.jsx)(n.h4,{id:"example-10",children:"Example"}),"\n",(0,r.jsx)(n.p,{children:"Delete the record with an id equal to 1."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const deletedRecord = await this.service.deleteOne(1);\n"})}),"\n",(0,r.jsx)(n.h3,{id:"delete-many",children:"Delete Many"}),"\n",(0,r.jsxs)(n.p,{children:["To delete multiple records use the ",(0,r.jsx)(n.code,{children:"deleteMany"})," method."]}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.strong,{children:"NOTE"})," This method returns a ",(0,r.jsx)(n.code,{children:"DeleteManyResponse"})," which contains the deleted record count."]}),"\n",(0,r.jsx)(n.h4,{id:"example-11",children:"Example"}),"\n",(0,r.jsxs)(n.p,{children:["Delete all ",(0,r.jsx)(n.code,{children:"TodoItemEntities"})," older than ",(0,r.jsx)(n.code,{children:"Jan 1, 2019"}),"."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",children:"const { deletedCount } = await this.service.deleteMany(\n  { created: { lte: new Date('2019-1-1') } } // filter\n);\n"})}),"\n",(0,r.jsx)(n.h2,{id:"foreign-keys",children:"Foreign Keys"}),"\n",(0,r.jsx)(n.p,{children:"It is a common use case to include a foreign key from your entity in your DTO."}),"\n",(0,r.jsx)(n.p,{children:"To do this you should add the foreign key to your entity as well as your DTO."}),"\n",(0,r.jsx)(n.admonition,{type:"note",children:(0,r.jsx)(n.p,{children:"This section only applies when using typeorm and sequelize with relations"})}),"\n",(0,r.jsx)(n.h3,{id:"example-12",children:"Example"}),"\n",(0,r.jsx)(n.p,{children:"Assume TodoItems can have SubTasks we would set up our SubTaskEntity using the following"}),"\n",(0,r.jsxs)(l.A,{defaultValue:"typeorm",groupId:"orm",values:[{label:"TypeOrm",value:"typeorm"},{label:"Sequelize",value:"sequelize"}],children:[(0,r.jsx)(i.A,{value:"typeorm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="sub-task.entity.ts"',children:"import {\n  Entity,\n  PrimaryGeneratedColumn,\n  Column,\n  CreateDateColumn,\n  UpdateDateColumn,\n  ObjectType,\n  ManyToOne,\n  JoinColumn,\n} from 'typeorm';\nimport { TodoItemEntity } from '../todo-item/todo-item.entity';\n\n@Entity({ name: 'sub_task' })\nexport class SubTaskEntity {\n  @PrimaryGeneratedColumn()\n  id!: number;\n\n  @Column()\n  title!: string;\n\n  @Column({ nullable: true })\n  description?: string;\n\n  @Column()\n  completed!: boolean;\n\n  // add the todoItemId to the model\n  @Column({ nullable: false, name: 'todo_item_id' })\n  todoItemId!: string;\n\n  @ManyToOne((): ObjectType<TodoItemEntity> => TodoItemEntity, (td) => td.subTasks, {\n    onDelete: 'CASCADE',\n    nullable: false,\n  })\n  // specify the join column we want to use.\n  @JoinColumn({ name: 'todo_item_id' })\n  todoItem!: TodoItemEntity;\n\n  @CreateDateColumn()\n  created!: Date;\n\n  @UpdateDateColumn()\n  updated!: Date;\n}\n"})})}),(0,r.jsx)(i.A,{value:"sequelize",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="sub-task.entity.ts"',children:"import {\n  Table,\n  AllowNull,\n  Column,\n  ForeignKey,\n  BelongsTo,\n  CreatedAt,\n  UpdatedAt,\n  Model,\n  AutoIncrement,\n  PrimaryKey,\n} from 'sequelize-typescript';\nimport { TodoItemEntity } from '../todo-item/entity/todo-item.entity';\n\n@Table({})\nexport class SubTaskEntity extends Model<SubTaskEntity, Partial<SubTaskEntity>> {\n  @PrimaryKey\n  @AutoIncrement\n  @Column\n  id!: number;\n\n  @Column\n  title!: string;\n\n  @AllowNull\n  @Column\n  description?: string;\n\n  @Column\n  completed!: boolean;\n\n  @Column\n  @ForeignKey(() => TodoItemEntity)\n  todoItemId!: number;\n\n  @BelongsTo(() => TodoItemEntity)\n  todoItem!: TodoItemEntity;\n\n  @CreatedAt\n  created!: Date;\n\n  @UpdatedAt\n  updated!: Date;\n}\n"})})})]}),"\n",(0,r.jsxs)(n.p,{children:["Then we could add the ",(0,r.jsx)(n.code,{children:"todoItemId"})," to the SubTaskDTO."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="sub-task.dto.ts" {24-26}',children:"import { FilterableField, IDField } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';\n\n@ObjectType('SubTask')\nexport class SubTaskDTO {\n  @IDField(() => ID)\n  id!: number;\n\n  @FilterableField()\n  title!: string;\n\n  @FilterableField({ nullable: true })\n  description?: string;\n\n  @FilterableField()\n  completed!: boolean;\n\n  @FilterableField(() => GraphQLISODateTime)\n  created!: Date;\n\n  @FilterableField(() => GraphQLISODateTime)\n  updated!: Date;\n\n  // expose the todoItemId as a filterable field.\n  @FilterableField()\n  todoItemId!: string;\n}\n"})}),"\n",(0,r.jsx)(n.h2,{id:"relations",children:"Relations"}),"\n",(0,r.jsx)(n.admonition,{type:"note",children:(0,r.jsx)(n.p,{children:"This section only applies when you combine your DTO and entity and are using Typeorm or Sequelize"})}),"\n",(0,r.jsxs)(n.p,{children:["When your DTO and entity are the same class and you have relations defined, you should not decorate your the relations in the DTO with ",(0,r.jsx)(n.code,{children:"@Field"})," or ",(0,r.jsx)(n.code,{children:"@FilterableField"}),"."]}),"\n",(0,r.jsxs)(n.p,{children:["Instead decorate the class with ",(0,r.jsx)(n.code,{children:"@CursorConnection"}),", ",(0,r.jsx)(n.code,{children:"@OffsetConnection"}),", ",(0,r.jsx)(n.code,{children:"@UnPagedRelation"})," or ",(0,r.jsx)(n.code,{children:"@Relation"}),"."]}),"\n",(0,r.jsx)(n.h3,{id:"example-13",children:"Example"}),"\n",(0,r.jsx)(n.p,{children:"Assume you have the following subtask definition."}),"\n",(0,r.jsxs)(l.A,{defaultValue:"typeorm",groupId:"orm",values:[{label:"TypeOrm",value:"typeorm"},{label:"Sequelize",value:"sequelize"}],children:[(0,r.jsx)(i.A,{value:"typeorm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="sub-task.ts"  {15,38-44}',children:"import {\n  Entity,\n  PrimaryGeneratedColumn,\n  Column,\n  CreateDateColumn,\n  UpdateDateColumn,\n  ManyToOne,\n  JoinColumn,\n} from 'typeorm';\nimport { ObjectType, ID } from '@nestjs/graphql';\nimport { FilterableField, IDField, Relation } from '@ptc-org/nestjs-query-graphql';\nimport { TodoItem } from '../todo-item/todo-item';\n\n@ObjectType()\n@Relation('todoItem', () => TodoItem, { update: { enabled: true } })\n@Entity({ name: 'sub_task' })\nexport class SubTask {\n  @IDField(() => ID)\n  @PrimaryGeneratedColumn()\n  id!: number;\n\n  @FilterableField()\n  @Column()\n  title!: string;\n\n  @FilterableField()\n  @Column({ nullable: true })\n  description?: string;\n\n  @FilterableField()\n  @Column()\n  completed!: boolean;\n\n  @FilterableField()\n  @Column({ nullable: false, name: 'todo_item_id' })\n  todoItemId!: string;\n\n  // do not decorate with @Field\n  @ManyToOne(() => TodoItem, (td) => td.subTasks, {\n    onDelete: 'CASCADE',\n    nullable: false,\n  })\n  @JoinColumn({ name: 'todo_item_id' })\n  todoItem!: TodoItem;\n\n  @FilterableField()\n  @CreateDateColumn()\n  created!: Date;\n\n  @FilterableField()\n  @UpdateDateColumn()\n  updated!: Date;\n}\n"})})}),(0,r.jsx)(i.A,{value:"sequelize",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-ts",metastring:'title="sub-task.ts" {18,45-47}',children:"import {\n  Table,\n  AllowNull,\n  Column,\n  ForeignKey,\n  BelongsTo,\n  CreatedAt,\n  UpdatedAt,\n  Model,\n  AutoIncrement,\n  PrimaryKey,\n} from 'sequelize-typescript';\nimport { FilterableField, IDField } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType, ID, GraphQLISODateTime } from '@nestjs/graphql';\nimport { TodoItem } from '../todo-item/entity/todo-item';\n\n@ObjectType()\n@Relation('todoItem', () => TodoItem, { update: { enabled: true } })\n@Table\nexport class SubTaskEntity extends Model<SubTaskEntity, Partial<SubTaskEntity>> {\n  @IDField(() => ID)\n  @PrimaryKey\n  @AutoIncrement\n  @Column\n  id!: number;\n\n  @FilterableField()\n  @Column\n  title!: string;\n\n  @FilterableField({ nullable: true })\n  @AllowNull\n  @Column\n  description?: string;\n\n  @FilterableField()\n  @Column\n  completed!: boolean;\n\n  @FilterableField()\n  @Column\n  @ForeignKey(() => TodoItemEntity)\n  todoItemId!: number;\n\n  // do not decorate with @Field\n  @BelongsTo(() => TodoItem)\n  todoItem!: TodoItem;\n\n  @FilterableField(() => GraphQLISODateTime)\n  @CreatedAt\n  created!: Date;\n\n  @FilterableField(() => GraphQLISODateTime)\n  @UpdatedAt\n  updated!: Date;\n}\n"})})})]}),"\n",(0,r.jsxs)(n.p,{children:["Notice how the ",(0,r.jsx)(n.code,{children:"todoItem"})," is not decorated with a field decorator, instead it is exposed through the ",(0,r.jsx)(n.code,{children:"@Relation"})," decorator."]})]})}function p(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(m,{...e})}):m(e)}},9365:(e,n,t)=>{t.d(n,{A:()=>i});t(6540);var r=t(4164);const o={tabItem:"tabItem_Ymn6"};var l=t(4848);function i(e){var n=e.children,t=e.hidden,i=e.className;return(0,l.jsx)("div",{role:"tabpanel",className:(0,r.A)(o.tabItem,i),hidden:t,children:n})}},1470:(e,n,t)=>{t.d(n,{A:()=>T});var r=t(6540),o=t(4164),l=t(3104),i=t(6347),s=t(205),a=t(7485),d=t(1682),c=t(8760);function u(e){var n,t;return null!=(n=null==(t=r.Children.toArray(e).filter((function(e){return"\n"!==e})).map((function(e){if(!e||(0,r.isValidElement)(e)&&((n=e.props)&&"object"==typeof n&&"value"in n))return e;var n;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})))?void 0:t.filter(Boolean))?n:[]}function m(e){var n=e.values,t=e.children;return(0,r.useMemo)((function(){var e=null!=n?n:function(e){return u(e).map((function(e){var n=e.props;return{value:n.value,label:n.label,attributes:n.attributes,default:n.default}}))}(t);return function(e){var n=(0,d.XI)(e,(function(e,n){return e.value===n.value}));if(n.length>0)throw new Error('Docusaurus error: Duplicate values "'+n.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.')}(e),e}),[n,t])}function p(e){var n=e.value;return e.tabValues.some((function(e){return e.value===n}))}function h(e){var n=e.queryString,t=void 0!==n&&n,o=e.groupId,l=(0,i.W6)(),s=function(e){var n=e.queryString,t=void 0!==n&&n,r=e.groupId;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!r)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return null!=r?r:null}({queryString:t,groupId:o});return[(0,a.aZ)(s),(0,r.useCallback)((function(e){if(s){var n=new URLSearchParams(l.location.search);n.set(s,e),l.replace(Object.assign({},l.location,{search:n.toString()}))}}),[s,l])]}function x(e){var n,t,o,l,i=e.defaultValue,a=e.queryString,d=void 0!==a&&a,u=e.groupId,x=m(e),g=(0,r.useState)((function(){return function(e){var n,t=e.defaultValue,r=e.tabValues;if(0===r.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!p({value:t,tabValues:r}))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+t+'" but none of its children has the corresponding value. Available values are: '+r.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");return t}var o=null!=(n=r.find((function(e){return e.default})))?n:r[0];if(!o)throw new Error("Unexpected error: 0 tabValues");return o.value}({defaultValue:i,tabValues:x})})),y=g[0],j=g[1],v=h({queryString:d,groupId:u}),f=v[0],b=v[1],T=(n=function(e){return e?"docusaurus.tab."+e:null}({groupId:u}.groupId),t=(0,c.Dv)(n),o=t[0],l=t[1],[o,(0,r.useCallback)((function(e){n&&l.set(e)}),[n,l])]),I=T[0],E=T[1],C=function(){var e=null!=f?f:I;return p({value:e,tabValues:x})?e:null}();return(0,s.A)((function(){C&&j(C)}),[C]),{selectedValue:y,selectValue:(0,r.useCallback)((function(e){if(!p({value:e,tabValues:x}))throw new Error("Can't select invalid tab value="+e);j(e),b(e),E(e)}),[b,E,x]),tabValues:x}}var g=t(2303);const y={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};var j=t(4848);function v(e){var n=e.className,t=e.block,r=e.selectedValue,i=e.selectValue,s=e.tabValues,a=[],d=(0,l.a_)().blockElementScrollPositionUntilNextRender,c=function(e){var n=e.currentTarget,t=a.indexOf(n),o=s[t].value;o!==r&&(d(n),i(o))},u=function(e){var n,t=null;switch(e.key){case"Enter":c(e);break;case"ArrowRight":var r,o=a.indexOf(e.currentTarget)+1;t=null!=(r=a[o])?r:a[0];break;case"ArrowLeft":var l,i=a.indexOf(e.currentTarget)-1;t=null!=(l=a[i])?l:a[a.length-1]}null==(n=t)||n.focus()};return(0,j.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,o.A)("tabs",{"tabs--block":t},n),children:s.map((function(e){var n=e.value,t=e.label,l=e.attributes;return(0,j.jsx)("li",Object.assign({role:"tab",tabIndex:r===n?0:-1,"aria-selected":r===n,ref:function(e){return a.push(e)},onKeyDown:u,onClick:c},l,{className:(0,o.A)("tabs__item",y.tabItem,null==l?void 0:l.className,{"tabs__item--active":r===n}),children:null!=t?t:n}),n)}))})}function f(e){var n=e.lazy,t=e.children,l=e.selectedValue,i=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){var s=i.find((function(e){return e.props.value===l}));return s?(0,r.cloneElement)(s,{className:(0,o.A)("margin-top--md",s.props.className)}):null}return(0,j.jsx)("div",{className:"margin-top--md",children:i.map((function(e,n){return(0,r.cloneElement)(e,{key:n,hidden:e.props.value!==l})}))})}function b(e){var n=x(e);return(0,j.jsxs)("div",{className:(0,o.A)("tabs-container",y.tabList),children:[(0,j.jsx)(v,Object.assign({},n,e)),(0,j.jsx)(f,Object.assign({},n,e))]})}function T(e){var n=(0,g.A)();return(0,j.jsx)(b,Object.assign({},e,{children:u(e.children)}),String(n))}},8453:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>s});var r=t(6540);const o={},l=r.createContext(o);function i(e){const n=r.useContext(l);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:i(e.components),r.createElement(l.Provider,{value:n},e.children)}}}]);