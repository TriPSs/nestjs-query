"use strict";(self.webpackChunknestjs_query=self.webpackChunknestjs_query||[]).push([[8055],{2342:(e,t,n)=>{n.d(t,{Z:()=>l});var o=n(7294),a=n(6010);const r="tabItem_Ymn6";function l(e){var t=e.children,n=e.hidden,l=e.className;return o.createElement("div",{role:"tabpanel",className:(0,a.Z)(r,l),hidden:n},t)}},7303:(e,t,n)=>{n.d(t,{Z:()=>c});var o=n(7462),a=n(7294),r=n(6010),l=n(5730),p=n(636),s=n(6602),i=n(3735);const d="tabList__CuJ",m="tabItem_LNqP";function u(e){var t,n,l=e.lazy,u=e.block,c=e.defaultValue,g=e.values,y=e.groupId,T=e.className,h=a.Children.map(e.children,(function(e){if((0,a.isValidElement)(e)&&"value"in e.props)return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})),k=null!=g?g:h.map((function(e){var t=e.props;return{value:t.value,label:t.label,attributes:t.attributes}})),f=(0,p.l)(k,(function(e,t){return e.value===t.value}));if(f.length>0)throw new Error('Docusaurus error: Duplicate values "'+f.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.');var v=null===c?c:null!=(t=null!=c?c:null==(n=h.find((function(e){return e.props.default})))?void 0:n.props.value)?t:h[0].props.value;if(null!==v&&!k.some((function(e){return e.value===v})))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+v+'" but none of its children has the corresponding value. Available values are: '+k.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");var b=(0,s.U)(),N=b.tabGroupChoices,I=b.setTabGroupChoices,C=(0,a.useState)(v),x=C[0],j=C[1],q=[],M=(0,i.o5)().blockElementScrollPositionUntilNextRender;if(null!=y){var O=N[y];null!=O&&O!==x&&k.some((function(e){return e.value===O}))&&j(O)}var D=function(e){var t=e.currentTarget,n=q.indexOf(t),o=k[n].value;o!==x&&(M(t),j(o),null!=y&&I(y,String(o)))},Z=function(e){var t,n=null;switch(e.key){case"Enter":D(e);break;case"ArrowRight":var o,a=q.indexOf(e.currentTarget)+1;n=null!=(o=q[a])?o:q[0];break;case"ArrowLeft":var r,l=q.indexOf(e.currentTarget)-1;n=null!=(r=q[l])?r:q[q.length-1]}null==(t=n)||t.focus()};return a.createElement("div",{className:(0,r.Z)("tabs-container",d)},a.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,r.Z)("tabs",{"tabs--block":u},T)},k.map((function(e){var t=e.value,n=e.label,l=e.attributes;return a.createElement("li",(0,o.Z)({role:"tab",tabIndex:x===t?0:-1,"aria-selected":x===t,key:t,ref:function(e){return q.push(e)},onKeyDown:Z,onClick:D},l,{className:(0,r.Z)("tabs__item",m,null==l?void 0:l.className,{"tabs__item--active":x===t})}),null!=n?n:t)}))),l?(0,a.cloneElement)(h.filter((function(e){return e.props.value===x}))[0],{className:"margin-top--md"}):a.createElement("div",{className:"margin-top--md"},h.map((function(e,t){return(0,a.cloneElement)(e,{key:t,hidden:e.props.value!==x})}))))}function c(e){var t=(0,l.Z)();return a.createElement(u,(0,o.Z)({key:String(t)},e))}},5204:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>m,default:()=>T,frontMatter:()=>d,metadata:()=>u,toc:()=>g});var o=n(7462),a=n(3366),r=(n(7294),n(3905)),l=n(7303),p=n(2342),s=n(1402),i=["components"],d={title:"Example",sidebar_label:"Example"},m=void 0,u={unversionedId:"introduction/example",id:"introduction/example",title:"Example",description:"Let's create a simple todo-item graphql example.",source:"@site/docs/introduction/example.mdx",sourceDirName:"introduction",slug:"/introduction/example",permalink:"/nestjs-query/docs/introduction/example",draft:!1,editUrl:"https://github.com/tripss/nestjs-query/edit/master/documentation/docs/introduction/example.mdx",tags:[],version:"current",frontMatter:{title:"Example",sidebar_label:"Example"},sidebar:"docs",previous:{title:"Install",permalink:"/nestjs-query/docs/introduction/install"},next:{title:"DTOs",permalink:"/nestjs-query/docs/concepts/dtos"}},c={},g=[{value:"Set up a new nest app",id:"set-up-a-new-nest-app",level:2},{value:"Install Dependencies",id:"install-dependencies",level:2},{value:"Generate the Module",id:"generate-the-module",level:2},{value:"Create the Entity",id:"create-the-entity",level:2},{value:"Create the DTO",id:"create-the-dto",level:2},{value:"Create the create DTO class.",id:"create-the-create-dto-class",level:2},{value:"Wire everything up.",id:"wire-everything-up",level:2},{value:"Running the Example",id:"running-the-example",level:2},{value:"Exploring The GraphQL Endpoint",id:"exploring-the-graphql-endpoint",level:2},{value:"Create a TodoItem",id:"create-a-todoitem",level:3},{value:"Create Multiple TodoItems",id:"create-multiple-todoitems",level:3},{value:"Query For Multiple TodoItems",id:"query-for-multiple-todoitems",level:3},{value:"Query for all todo items",id:"query-for-all-todo-items",level:4},{value:"Query for completed todo items",id:"query-for-completed-todo-items",level:4},{value:"Query For One TodoItem",id:"query-for-one-todoitem",level:3},{value:"Query by id",id:"query-by-id",level:4},{value:"Update a TodoItem",id:"update-a-todoitem",level:3},{value:"Update Multiple TodoItems",id:"update-multiple-todoitems",level:3},{value:"Delete One TodoItem",id:"delete-one-todoitem",level:3},{value:"Delete Many TodoItems",id:"delete-many-todoitems",level:3}],y={toc:g};function T(e){var t=e.components,n=(0,a.Z)(e,i);return(0,r.kt)("wrapper",(0,o.Z)({},y,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"Let's create a simple todo-item graphql example."),(0,r.kt)("h2",{id:"set-up-a-new-nest-app"},"Set up a new nest app"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"npm i -g @nestjs/cli\nnest new nestjs-query-getting-started\n")),(0,r.kt)("h2",{id:"install-dependencies"},"Install Dependencies"),(0,r.kt)("p",null,(0,r.kt)("a",{parentName:"p",href:"/nestjs-query/docs/introduction/install"},"Install your packages"),"."),(0,r.kt)("admonition",{type:"note"},(0,r.kt)("p",{parentName:"admonition"},"Be sure to install the correct ORM package!")),(0,r.kt)("p",null,"Install extra dependencies for the example."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"npm i pg apollo-server-express\n")),(0,r.kt)("h2",{id:"generate-the-module"},"Generate the Module"),(0,r.kt)("p",null,"From the root of your project run:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"npx nest g mo todo-item\n")),(0,r.kt)("h2",{id:"create-the-entity"},"Create the Entity"),(0,r.kt)("p",null,"From the root of your project run:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"npx nest g cl todo-item.entity todo-item --flat\n")),(0,r.kt)("p",null,"Now lets fill out the entity."),(0,r.kt)("p",null,"Add the following to ",(0,r.kt)("inlineCode",{parentName:"p"},"src/todo-item/todo-item.entity.ts"),"."),(0,r.kt)(l.Z,{defaultValue:"typeorm",groupId:"orm",values:[{label:"TypeOrm",value:"typeorm"},{label:"Sequelize",value:"sequelize"},{label:"Mongoose",value:"mongoose"},{label:"Typegoose",value:"typegoose"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"typeorm",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="todo-item/todo-item.entity.ts"',title:'"todo-item/todo-item.entity.ts"'},"import {\n  Column,\n  CreateDateColumn,\n  Entity,\n  PrimaryGeneratedColumn,\n  UpdateDateColumn,\n} from 'typeorm';\n\n@Entity()\nexport class TodoItemEntity {\n  @PrimaryGeneratedColumn()\n  id!: string;\n\n  @Column()\n  title!: string;\n\n  @Column()\n  completed!: boolean;\n\n  @CreateDateColumn()\n  created!: Date;\n\n  @UpdateDateColumn()\n  updated!: Date;\n}\n"))),(0,r.kt)(p.Z,{value:"sequelize",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="todo-item/todo-item.entity.ts"',title:'"todo-item/todo-item.entity.ts"'},"import {\n  Table,\n  Column,\n  Model,\n  CreatedAt,\n  UpdatedAt,\n  PrimaryKey,\n  AutoIncrement,\n} from 'sequelize-typescript';\n\n@Table\nexport class TodoItemEntity extends Model<TodoItemEntity, Partial<TodoItemEntity>> {\n  @PrimaryKey\n  @AutoIncrement\n  @Column\n  id!: number;\n\n  @Column\n  title!: string;\n\n  @Column\n  completed!: boolean;\n\n  @CreatedAt\n  created!: Date;\n\n  @UpdatedAt\n  updated!: Date;\n}\n\n"))),(0,r.kt)(p.Z,{value:"mongoose",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="todo-item/todo-item.entity.ts"',title:'"todo-item/todo-item.entity.ts"'},"import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';\nimport { Document } from 'mongoose';\n\n@Schema({ timestamps: { createdAt: 'created', updatedAt: 'updated' } })\nexport class TodoItemEntity extends Document {\n  @Prop({ required: true })\n  title!: string;\n\n  @Prop()\n  description?: string;\n\n  @Prop({ required: true })\n  completed!: boolean;\n\n  @Prop({ default: Date.now })\n  created!: Date;\n\n  @Prop({ default: Date.now })\n  updated!: Date;\n}\n\nexport const TodoItemEntitySchema = SchemaFactory.createForClass(TodoItemEntity);\n\n"))),(0,r.kt)(p.Z,{value:"typegoose",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="todo-item/todo-item.entity.ts"',title:'"todo-item/todo-item.entity.ts"'},"import { ObjectId } from '@ptc-org/nestjs-query-graphql'\nimport { Base } from '@typegoose/typegoose/lib/defaultClasses';\nimport { Prop, modelOptions, Ref } from '@typegoose/typegoose';\nimport { Types } from 'mongoose';\nimport { SubTaskEntity } from '../sub-task/sub-task.entity';\nimport { TagEntity } from '../tag/tag.entity';\n\n@modelOptions({\n  schemaOptions: {\n    timestamps: { createdAt: 'created', updatedAt: 'updated' },\n    collection: 'todo-items',\n    toObject: { virtuals: true },\n  },\n})\nexport class TodoItemEntity implements Base {\n  @ObjectId()\n  _id!: Types.ObjectId\n\n  id!: string  \n\n  @Prop({ required: true })\n  title!: string;\n\n  @Prop()\n  description?: string;\n\n  @Prop({ required: true })\n  completed!: boolean;\n\n  @Prop({ default: Date.now })\n  created!: Date;\n\n  @Prop({ default: Date.now })\n  updated!: Date;\n}\n")))),(0,r.kt)("h2",{id:"create-the-dto"},"Create the DTO"),(0,r.kt)("p",null,"The DTO (Data Transfer Object) is used by the resolver to represent incoming requests and outgoing responses."),(0,r.kt)("p",null,"The DTO is where you can:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"Define fields that should be rendered by graphql."),(0,r.kt)("li",{parentName:"ul"},"Define fields that should be filterable using the ",(0,r.kt)("inlineCode",{parentName:"li"},"@FilterableField")," decorator."),(0,r.kt)("li",{parentName:"ul"},"Define validation that will be used by mutations.")),(0,r.kt)("p",null,"In this example the DTO and entity are two different classes to clearly demonstrate what is required for ",(0,r.kt)("inlineCode",{parentName:"p"},"graphql")," vs\nthe persistence layer. However, you can combine the two into a single class."),(0,r.kt)("p",null,"From the root of your project run:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"npx nest g cl todo-item.dto todo-item --flat\n")),(0,r.kt)("p",null,"Now lets fill out the DTO. Add the following to ",(0,r.kt)("inlineCode",{parentName:"p"},"src/todo-item/todo-item.dto.ts"),"."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="todo-item/todo-item.dto.ts"',title:'"todo-item/todo-item.dto.ts"'},"import { FilterableField, IDField } from '@ptc-org/nestjs-query-graphql';\nimport { ObjectType, GraphQLISODateTime, Field, ID } from '@nestjs/graphql';\n\n@ObjectType('TodoItem')\nexport class TodoItemDTO {\n  @IDField(() => ID)\n  id!: number;\n\n  @FilterableField()\n  title!: string;\n\n  @FilterableField()\n  completed!: boolean;\n\n  @Field(() => GraphQLISODateTime)\n  created!: Date;\n\n  @Field(() => GraphQLISODateTime)\n  updated!: Date;\n}\n\n\n")),(0,r.kt)("p",null,"Notice the use of ",(0,r.kt)("inlineCode",{parentName:"p"},"@FilterableField")," this will let ",(0,r.kt)("inlineCode",{parentName:"p"},"@ptc-org/nestjs-query-graphql")," know to allow filtering on the\ncorresponding field. If you just use ",(0,r.kt)("inlineCode",{parentName:"p"},"@Field")," then you will not be able to filter on the corresponding field."),(0,r.kt)("h2",{id:"create-the-create-dto-class"},"Create the create DTO class."),(0,r.kt)("p",null,"From the previously created DTO, ",(0,r.kt)("inlineCode",{parentName:"p"},"@ptc-org/nestjs-query-graphql")," will automatically create a ",(0,r.kt)("inlineCode",{parentName:"p"},"CreateTodoItem")," graphql type:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},"input CreateTodoItem {\n  id: ID!\n  title: String!\n  completed: Boolean!\n  created: DateTime!\n  updated: DateTime!\n}\n")),(0,r.kt)("p",null,"But in our case, the fields ",(0,r.kt)("inlineCode",{parentName:"p"},"id"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"created")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"updated")," are actually not\nrequired when creating a ",(0,r.kt)("inlineCode",{parentName:"p"},"TodoItem"),": they will be autogenerated. We only need to\nprovide ",(0,r.kt)("inlineCode",{parentName:"p"},"title")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"completed"),". To create a DTO that does not require these\nfields, we can create a custom create DTO:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"npx nest g cl todo-item.create.dto todo-item --flat\n")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:'title="todo-item/todo-item.create.dto.ts"',title:'"todo-item/todo-item.create.dto.ts"'},"import { IsBoolean, IsString } from 'class-validator';\n\n@InputType('CreateTodoItem')\nexport class TodoItemCreateDTO {\n  @IsString()\n  @Field()\n  title!: string;\n\n  @IsBoolean()\n  @Field()\n  completed!: boolean;\n}\n")),(0,r.kt)("h2",{id:"wire-everything-up"},"Wire everything up."),(0,r.kt)("p",null,"Update the ",(0,r.kt)("inlineCode",{parentName:"p"},"todo-item.module")," to set up the ",(0,r.kt)("inlineCode",{parentName:"p"},"NestjsQueryGraphQLModule")," and the entities to provide a ",(0,r.kt)("inlineCode",{parentName:"p"},"QueryService"),"."),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"NestjsQueryGraphQLModule")," will automatically create a Resolver that will expose the following ",(0,r.kt)("inlineCode",{parentName:"p"},"queries")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"mutations"),":"),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Queries")),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"todoItems")," - find multiple ",(0,r.kt)("inlineCode",{parentName:"li"},"TodoItem"),"s."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"todoItem")," - find one ",(0,r.kt)("inlineCode",{parentName:"li"},"TodoItem"),".")),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"Mutations")),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"createManyTodoItems")," - create multiple ",(0,r.kt)("inlineCode",{parentName:"li"},"TodoItem"),"s."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"createOneTodoItems")," - create one ",(0,r.kt)("inlineCode",{parentName:"li"},"TodoItem"),"."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"updateManyTodoItems")," - update multiple ",(0,r.kt)("inlineCode",{parentName:"li"},"TodoItems"),"."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"updateOneTodoItems")," - update one ",(0,r.kt)("inlineCode",{parentName:"li"},"TodoItem"),"."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"deleteManyTodoItems")," - delete multiple ",(0,r.kt)("inlineCode",{parentName:"li"},"TodoItems"),"s."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"deleteOneTodoItems")," - delete one ",(0,r.kt)("inlineCode",{parentName:"li"},"TodoItem"),".")),(0,r.kt)(l.Z,{defaultValue:"typeorm",groupId:"orm",values:[{label:"TypeOrm",value:"typeorm"},{label:"Sequelize",value:"sequelize"},{label:"Mongoose",value:"mongoose"},{label:"Typegoose",value:"typegoose"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"typeorm",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:"{10-22}","{10-22}":!0},"import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';\nimport { Module } from '@nestjs/common';\nimport { TodoItemCreateDTO } from './todo-item.create.dto';\nimport { TodoItemDTO } from './todo-item.dto';\nimport { TodoItemEntity } from './todo-item.entity';\n\n@Module({\n  imports: [\n    NestjsQueryGraphQLModule.forFeature({\n      // import the NestjsQueryTypeOrmModule to register the entity with typeorm\n      // and provide a QueryService\n      imports: [NestjsQueryTypeOrmModule.forFeature([TodoItemEntity])],\n      // describe the resolvers you want to expose\n      resolvers: [\n        {\n          EntityClass: TodoItemEntity\n          DTOClass: TodoItemDTO,\n          CreateDTOClass: TodoItemCreateDTO,\n        },\n      ],\n    }),\n  ],\n})\nexport class TodoItemModule {}\n"))),(0,r.kt)(p.Z,{value:"sequelize",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:"{9-15}","{9-15}":!0},"import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQuerySequelizeModule } from '@ptc-org/nestjs-query-sequelize';\nimport { Module } from '@nestjs/common';\nimport { TodoItemDTO } from './todo-item.dto';\nimport { TodoItemEntity } from './todo-item.entity';\n\n@Module({\n  imports: [\n    NestjsQueryGraphQLModule.forFeature({\n      // import the NestjsQuerySequelizeModule to register the entity with sequelize\n      // and provide a QueryService\n      imports: [NestjsQuerySequelizeModule.forFeature([TodoItemEntity])],\n      // describe the resolvers you want to expose\n      resolvers: [{ DTOClass: TodoItemDTO, EntityClass: TodoItemEntity }],\n    }),\n  ],\n})\nexport class TodoItemModule {}\n"))),(0,r.kt)(p.Z,{value:"mongoose",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:"{9-19}","{9-19}":!0},"import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { NestjsQueryMongooseModule } from '@ptc-org/nestjs-query-mongoose';\nimport { Module } from '@nestjs/common';\nimport { TodoItemDTO } from './todo-item.dto';\nimport { TodoItemEntity, TodoItemEntitySchema } from './todo-item.entity';\n\n@Module({\n  imports: [\n    NestjsQueryGraphQLModule.forFeature({\n      // import the NestjsQueryMongooseModule to register the entity with mongoose\n      // and provide a QueryService\n      imports: [\n        NestjsQueryMongooseModule.forFeature([\n          { document: TodoItemEntity, name: TodoItemEntity.name, schema: TodoItemEntitySchema },\n        ]),\n      ],\n      // describe the resolvers you want to expose\n      resolvers: [{ DTOClass: TodoItemDTO, EntityClass: TodoItemEntity }],\n    }),\n  ],\n})\nexport class TodoItemModule {}\n"))),(0,r.kt)(p.Z,{value:"typegoose",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts",metastring:"{9-19}","{9-19}":!0},"import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql';\nimport { Module } from '@nestjs/common';\nimport { NestjsQueryTypegooseModule } from '@ptc-org/nestjs-query-typegoose';\nimport { TodoItemDTO } from './dto/todo-item.dto';\nimport { TodoItemEntity } from './todo-item.entity';\n\nconst guards = [AuthGuard];\n@Module({\n  providers: [TodoItemResolver],\n  imports: [\n    NestjsQueryGraphQLModule.forFeature({\n      imports: [NestjsQueryTypegooseModule.forFeature([TodoItemEntity])],\n      resolvers: [{ DTOClass: TodoItemDTO, EntityClass: TodoItemEntity }],\n    }),\n  ],\n})\nexport class TodoItemModule {}\n")))),(0,r.kt)("p",null,"Next update ",(0,r.kt)("inlineCode",{parentName:"p"},"app.module")," to set up your db connection and the ",(0,r.kt)("inlineCode",{parentName:"p"},"graphql")," nest modules."),(0,r.kt)(l.Z,{defaultValue:"typeorm",groupId:"orm",values:[{label:"TypeOrm",value:"typeorm"},{label:"Sequelize",value:"sequelize"},{label:"Mongoose",value:"mongoose"},{label:"Typegoose",value:"typegoose"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"typeorm",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';\nimport { Module } from '@nestjs/common';\nimport { GraphQLModule } from '@nestjs/graphql';\nimport { TypeOrmModule } from '@nestjs/typeorm';\nimport { AppController } from './app.controller';\nimport { AppService } from './app.service';\nimport { TodoItemModule } from './todo-item/todo-item.module';\n\n@Module({\n  imports: [\n    TypeOrmModule.forRoot({\n      type: 'postgres',\n      database: 'gettingstarted',\n      username: 'gettingstarted',\n      autoLoadEntities: true,\n      synchronize: true,\n      logging: true,\n    }),\n    GraphQLModule.forRoot<ApolloDriverConfig>({\n      driver: ApolloDriver,\n      // set to true to automatically generate schema\n      autoSchemaFile: true,\n    }),\n    TodoItemModule,\n  ],\n  controllers: [AppController],\n  providers: [AppService],\n})\nexport class AppModule {}\n"))),(0,r.kt)(p.Z,{value:"sequelize",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';\nimport { Module } from '@nestjs/common';\nimport { GraphQLModule } from '@nestjs/graphql';\nimport { SequelizeModule } from '@nestjs/sequelize';\nimport { AppController } from './app.controller';\nimport { AppService } from './app.service';\nimport { TodoItemModule } from './todo-item/todo-item.module';\n\n@Module({\n  imports: [\n    TodoItemModule,\n    SequelizeModule.forRoot({\n      dialect: 'postgres',\n      database: 'gettingstarted',\n      username: 'gettingstarted',\n      autoLoadModels: true,\n      synchronize: true,\n      logging: true,\n    }),\n    GraphQLModule.forRoot<ApolloDriverConfig>({\n      driver: ApolloDriver,\n      // set to true to automatically generate schema\n      autoSchemaFile: true,\n    }),\n  ],\n  controllers: [AppController],\n  providers: [AppService],\n})\nexport class AppModule {}\n\n\n"))),(0,r.kt)(p.Z,{value:"mongoose",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';\nimport { Module } from '@nestjs/common';\nimport { GraphQLModule } from '@nestjs/graphql';\nimport { MongooseModule } from '@nestjs/mongoose';\nimport { AppController } from './app.controller';\nimport { AppService } from './app.service';\nimport { TodoItemModule } from './todo-item/todo-item.module';\n\n@Module({\n  imports: [\n    MongooseModule.forRoot('mongodb://localhost/nest', options),\n    GraphQLModule.forRoot<ApolloDriverConfig>({\n      driver: ApolloDriver,\n      // set to true to automatically generate schema\n      autoSchemaFile: true,\n    }),\n    TodoItemModule,\n  ],\n  controllers: [AppController],\n  providers: [AppService],\n})\nexport class AppModule {}\n\n\n"))),(0,r.kt)(p.Z,{value:"typegoose",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';\nimport { Module } from '@nestjs/common';\nimport { GraphQLModule } from '@nestjs/graphql';\nimport { TypegooseModule } from '@m8a/nestjs-typegoose';\nimport { TodoItemModule } from './todo-item/todo-item.module';\n\n@Module({\n  imports: [\n    TypegooseModule.forRoot('mongodb://localhost/nest', options),\n    GraphQLModule.forRoot<ApolloDriverConfig>({\n      driver: ApolloDriver,\n      // set to true to automatically generate schema\n      autoSchemaFile: true,\n    }),\n    TodoItemModule,\n  ],\n})\nexport class AppModule {}\n\n\n")),(0,r.kt)("p",null,(0,r.kt)("strong",{parentName:"p"},"NOTE")," For the sake of brevity, the ",(0,r.kt)("inlineCode",{parentName:"p"},"options")," object in the Mongoose and Typegoose examples aren't defined. If you'd like to see full examples of all of the persistence services, please refer to the ",(0,r.kt)("inlineCode",{parentName:"p"},"./examples")," directory in the ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/tripss/nestjs-query/tree/master/examples"},"source code"),"."))),(0,r.kt)("p",null,"Create a ",(0,r.kt)("inlineCode",{parentName:"p"},"docker-compose.yml")," file in the root of the project"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-dockerfile"},'version: "3"\n\nservices:\n  postgres:\n    image: "postgres:11.5"\n    environment:\n      - "POSTGRES_USER=gettingstarted"\n      - "POSTGRES_DB=gettingstarted"\n    expose:\n      - "5432"\n    ports:\n      - "5432:5432"\n  # only needed if using mongoose\n  mongo:\n    image: "mongo:4.4"\n    restart: always\n    ports:\n      - "27017:27017"\n  mongo-express:\n    image: "mongo-express:latest"\n    restart: always\n    ports:\n      - 8081:8081\n\n\n')),(0,r.kt)("h2",{id:"running-the-example"},"Running the Example"),(0,r.kt)("p",null,"Start the backing services"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"docker-compose up -d\n")),(0,r.kt)("p",null,"Start the app"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"npm start\n")),(0,r.kt)("p",null,"Visit http://localhost:3000/graphql where you should see the playground"),(0,r.kt)("img",{alt:"Example playground",src:(0,s.Z)("img/introduction/getting-started-playground.png")}),(0,r.kt)("h2",{id:"exploring-the-graphql-endpoint"},"Exploring The GraphQL Endpoint"),(0,r.kt)("h3",{id:"create-a-todoitem"},"Create a TodoItem"),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},'mutation {\n  createOneTodoItem(\n    input: { todoItem: { title: "Create One Todo Item", completed: false } }\n  ) {\n    id\n    title\n    completed\n    created\n    updated\n  }\n}\n'))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "createOneTodoItem": {\n      "id": "1",\n      "title": "Create One Todo Item",\n      "completed": false,\n      "created": "2020-01-01T00:43:16.000Z",\n      "updated": "2020-01-01T00:43:16.000Z"\n    }\n  }\n}\n')))),(0,r.kt)("h3",{id:"create-multiple-todoitems"},"Create Multiple TodoItems"),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},'mutation {\n  createManyTodoItems(\n    input: {\n      todoItems: [\n        { title: "Create Many Todo Items - 1", completed: false }\n        { title: "Create Many Todo Items - 2", completed: true }\n      ]\n    }\n  ) {\n    id\n    title\n    completed\n    created\n    updated\n  }\n}\n'))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "createManyTodoItems": [\n      {\n        "id": "2",\n        "title": "Create Many Todo Items - 1",\n        "completed": false,\n        "created": "2020-01-01T00:49:01.000Z",\n        "updated": "2020-01-01T00:49:01.000Z"\n      },\n      {\n        "id": "3",\n        "title": "Create Many Todo Items - 2",\n        "completed": true,\n        "created": "2020-01-01T00:49:01.000Z",\n        "updated": "2020-01-01T00:49:01.000Z"\n      }\n    ]\n  }\n}\n')))),(0,r.kt)("h3",{id:"query-for-multiple-todoitems"},"Query For Multiple TodoItems"),(0,r.kt)("h4",{id:"query-for-all-todo-items"},"Query for all todo items"),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},"{\n  todoItems {\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n    edges {\n      node {\n        id\n        title\n        completed\n        created\n        updated\n      }\n      cursor\n    }\n  }\n}\n"))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "todoItems": {\n      "pageInfo": {\n        "hasNextPage": false,\n        "hasPreviousPage": false,\n        "startCursor": "YXJyYXljb25uZWN0aW9uOjA=",\n        "endCursor": "YXJyYXljb25uZWN0aW9uOjI="\n      },\n      "edges": [\n        {\n          "node": {\n            "id": "1",\n            "title": "Create One Todo Item",\n            "completed": false,\n            "created": "2020-01-01T00:43:16.000Z",\n            "updated": "2020-01-01T00:43:16.000Z"\n          },\n          "cursor": "YXJyYXljb25uZWN0aW9uOjA="\n        },\n        {\n          "node": {\n            "id": "2",\n            "title": "Create Many Todo Items - 1",\n            "completed": false,\n            "created": "2020-01-01T00:49:01.000Z",\n            "updated": "2020-01-01T00:49:01.000Z"\n          },\n          "cursor": "YXJyYXljb25uZWN0aW9uOjE="\n        },\n        {\n          "node": {\n            "id": "3",\n            "title": "Create Many Todo Items - 2",\n            "completed": true,\n            "created": "2020-01-01T00:49:01.000Z",\n            "updated": "2020-01-01T00:49:01.000Z"\n          },\n          "cursor": "YXJyYXljb25uZWN0aW9uOjI="\n        }\n      ]\n    }\n  }\n}\n')))),(0,r.kt)("h4",{id:"query-for-completed-todo-items"},"Query for completed todo items"),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},"{\n  todoItems(filter: { completed: { is: true } }) {\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n    edges {\n      node {\n        id\n        title\n        completed\n        created\n        updated\n      }\n      cursor\n    }\n  }\n}\n"))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "todoItems": {\n      "pageInfo": {\n        "hasNextPage": false,\n        "hasPreviousPage": false,\n        "startCursor": "YXJyYXljb25uZWN0aW9uOjA=",\n        "endCursor": "YXJyYXljb25uZWN0aW9uOjA="\n      },\n      "edges": [\n        {\n          "node": {\n            "id": "3",\n            "title": "Create Many Todo Items - 2",\n            "completed": true,\n            "created": "2020-01-01T00:49:01.000Z",\n            "updated": "2020-01-01T00:49:01.000Z"\n          },\n          "cursor": "YXJyYXljb25uZWN0aW9uOjA="\n        }\n      ]\n    }\n  }\n}\n')))),(0,r.kt)("h3",{id:"query-for-one-todoitem"},"Query For One TodoItem"),(0,r.kt)("h4",{id:"query-by-id"},"Query by id"),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},"{\n  todoItem(id: 1) {\n    id\n    title\n    completed\n    created\n    updated\n  }\n}\n"))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "todoItem": {\n      "id": "1",\n      "title": "Create One Todo Item",\n      "completed": false,\n      "created": "2020-01-13T06:19:17.543Z",\n      "updated": "2020-01-13T06:19:17.543Z"\n    }\n  }\n}\n')))),(0,r.kt)("h3",{id:"update-a-todoitem"},"Update a TodoItem"),(0,r.kt)("p",null,"Lets update the completed ",(0,r.kt)("inlineCode",{parentName:"p"},"TodoItem")," we created earlier to not be completed."),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},"mutation {\n  updateOneTodoItem(input: { id: 3, update: { completed: false } }) {\n    id\n    title\n    completed\n    created\n    updated\n  }\n}\n"))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "updateOneTodoItem": {\n      "id": "3",\n      "title": "Create Many Todo Items - 2",\n      "completed": false,\n      "created": "2020-01-13T09:19:46.727Z",\n      "updated": "2020-01-13T09:23:37.658Z"\n    }\n  }\n}\n')))),(0,r.kt)("h3",{id:"update-multiple-todoitems"},"Update Multiple TodoItems"),(0,r.kt)("p",null,"Lets update the completed ",(0,r.kt)("inlineCode",{parentName:"p"},"TodoItem")," we created earlier to not be completed."),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},"mutation {\n  updateManyTodoItems(\n    input: { filter: { id: { in: [1, 2] } }, update: { completed: true } }\n  ) {\n    updatedCount\n  }\n}\n\n"))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "updateManyTodoItems": {\n      "updatedCount": 2\n    }\n  }\n}\n')))),(0,r.kt)("p",null,"You can check this by running the completed query from above."),(0,r.kt)("h3",{id:"delete-one-todoitem"},"Delete One TodoItem"),(0,r.kt)("p",null,"Lets update delete the first ",(0,r.kt)("inlineCode",{parentName:"p"},"TodoItem"),"."),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},"mutation {\n  deleteOneTodoItem(input: { id: 1 }) {\n    id\n    title\n    completed\n    created\n    updated\n  }\n}\n"))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "deleteOneTodoItem": {\n      "id": null,\n      "title": "Create One Todo Item",\n      "completed": true,\n      "created": "2020-01-13T09:44:41.176Z",\n      "updated": "2020-01-13T09:44:54.822Z"\n    }\n  }\n}\n')))),(0,r.kt)("h3",{id:"delete-many-todoitems"},"Delete Many TodoItems"),(0,r.kt)("p",null,"Lets update delete the create many todo items ",(0,r.kt)("inlineCode",{parentName:"p"},"TodoItem")," using a filter."),(0,r.kt)(l.Z,{defaultValue:"graphql",values:[{label:"GraphQL",value:"graphql"},{label:"Response",value:"response"}],mdxType:"Tabs"},(0,r.kt)(p.Z,{value:"graphql",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-graphql"},'mutation {\n  deleteManyTodoItems(\n    input: { filter: { title: { like: "Create Many Todo Items%" } } }\n  ) {\n    deletedCount\n  }\n}\n'))),(0,r.kt)(p.Z,{value:"response",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-json"},'{\n  "data": {\n    "deleteManyTodoItems": {\n      "deletedCount": 2\n    }\n  }\n}\n')))))}T.isMDXComponent=!0},3905:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>c});var o=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function p(e,t){if(null==e)return{};var n,o,a=function(e,t){if(null==e)return{};var n,o,a={},r=Object.keys(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var s=o.createContext({}),i=function(e){var t=o.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},d=function(e){var t=i(e.components);return o.createElement(s.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},u=o.forwardRef((function(e,t){var n=e.components,a=e.mdxType,r=e.originalType,s=e.parentName,d=p(e,["components","mdxType","originalType","parentName"]),u=i(n),c=a,g=u["".concat(s,".").concat(c)]||u[c]||m[c]||r;return n?o.createElement(g,l(l({ref:t},d),{},{components:n})):o.createElement(g,l({ref:t},d))}));function c(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=n.length,l=new Array(r);l[0]=u;var p={};for(var s in t)hasOwnProperty.call(t,s)&&(p[s]=t[s]);p.originalType=e,p.mdxType="string"==typeof e?e:a,l[1]=p;for(var i=2;i<r;i++)l[i]=n[i];return o.createElement.apply(null,l)}return o.createElement.apply(null,n)}u.displayName="MDXCreateElement"}}]);