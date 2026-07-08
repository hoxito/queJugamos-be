# AGENTS.md

Guia obligatoria para cualquier agente o desarrollador que trabaje en este repositorio.

## Objetivo del repositorio

Este backend debe mantenerse como una API NestJS simple, modular, testeable y facil de evolucionar. Cada cambio debe favorecer bajo acoplamiento, contratos explicitos, documentacion util y compatibilidad con la documentacion oficial de NestJS.

Referencias base:

- NestJS documentation: https://docs.nestjs.com/
- NestJS OpenAPI/Swagger: https://docs.nestjs.com/openapi/introduction
- NestJS testing: https://docs.nestjs.com/fundamentals/testing
- NestJS Prisma recipe: https://docs.nestjs.com/recipes/prisma

## Principios de arquitectura

- Seguir los patrones oficiales de NestJS: `module`, `controller`, `service`, providers inyectables, pipes, guards, interceptors y filters cuando apliquen.
- Organizar por dominio/modulo, no por tipo tecnico global. Ejemplo: `src/modules/games` contiene controller, service, DTOs, modelos/entidades y tests del dominio games.
- Mantener controladores delgados. Un controller solo debe manejar HTTP, validacion de entrada declarativa, parametros, codigos de respuesta y delegacion al service.
- Mantener services como capa de aplicacion. Un service orquesta reglas de negocio, transacciones y llamadas a persistencia, pero no debe mezclar detalles HTTP.
- Evitar dependencias cruzadas entre modulos. Si un modulo necesita capacidades de otro, consumirlas mediante providers exportados por el modulo propietario.
- No introducir singletons manuales, estado global mutable ni imports directos que salteen la inyeccion de dependencias de NestJS.
- Separar reglas puras en funciones o clases testeables cuando la logica crece. Mantener esas piezas sin dependencias de NestJS si no las necesitan.
- Preferir composicion sobre herencia. Usar clases base solo cuando exista una abstraccion estable y repetida.

## Acoplamiento y dependencias

- Cada provider debe depender de interfaces, tokens o servicios de dominio cuando eso reduzca acoplamiento real. No crear abstracciones vacias "por si acaso".
- No acceder a la base de datos desde controllers.
- No importar detalles internos de otro modulo. Importar desde el modulo publico o mover la logica compartida a `src/common` si realmente es transversal.
- Evitar ciclos de dependencias. Si aparece `forwardRef`, tratarlo como deuda tecnica y documentar por que no hay una alternativa simple.
- Toda integracion externa debe estar encapsulada en un provider dedicado, con configuracion via `ConfigService` y tests con mocks/fakes.

## Patrones de diseno permitidos

- Dependency Injection mediante providers de NestJS.
- Repository/Data Mapper a traves de Prisma Client y servicios de dominio, no consultas crudas dispersas.
- DTO + validation pipe para contratos de entrada.
- Mapper/Presenter cuando la respuesta publica no debe exponer directamente el modelo de persistencia.
- Factory solo cuando la construccion tenga reglas o variantes reales.
- Strategy cuando existan comportamientos intercambiables por configuracion o tipo de dominio.
- CQRS solo si el caso de uso justifica separar comandos/consultas; no introducirlo para CRUD simple.

## Persistencia y Prisma

- Prisma es el estandar objetivo para acceso a base de datos.
- Todo modelo nuevo de persistencia debe definirse en el schema de Prisma y accederse mediante un provider `PrismaService` o repositorio de modulo que lo envuelva.
- No agregar nuevas entidades TypeORM. El codigo TypeORM existente debe tratarse como legado hasta su migracion planificada a Prisma.
- Las migraciones de schema deben versionarse y ejecutarse de forma reproducible.
- No usar `synchronize: true` en entornos compartidos, staging o produccion.
- Las consultas raw solo se permiten cuando Prisma no pueda expresar la consulta con claridad. Deben usar parametros, tener tests y documentar brevemente el motivo fuera del codigo si es una decision relevante.

## DTOs, inputs, outputs y modelos

- Toda entrada HTTP debe tener un DTO dedicado con `class-validator` y, cuando corresponda, `class-transformer`.
- No reutilizar modelos de base de datos como DTOs de entrada.
- Definir DTOs de respuesta cuando la API publica no deba reflejar exactamente el modelo interno.
- Mantener nombres consistentes: `CreateXDto`, `UpdateXDto`, `QueryXDto`, `XResponseDto`.
- Usar enums de dominio para valores cerrados y documentarlos en Swagger.
- No aceptar propiedades desconocidas. Mantener `ValidationPipe` con `whitelist`, `forbidNonWhitelisted` y `transform`.

## Swagger y contrato HTTP

- Todo endpoint nuevo o modificado debe actualizar Swagger cuando sea posible.
- Usar `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiQuery`, `@ApiBody` y `@ApiProperty` cuando aporten claridad al contrato.
- Documentar status codes esperados, errores relevantes y DTOs de respuesta.
- Mantener `README.md` y documentos en `docs/` alineados con cambios de rutas, variables, comandos o contratos.
- No introducir endpoints no documentados salvo que sean internos y se justifique explicitamente.

## Testing obligatorio

- Todo archivo nuevo o modificado con logica debe tener tests unitarios asociados.
- Todo controller nuevo o endpoint modificado debe tener cobertura e2e o de integracion HTTP.
- Todo service con reglas de negocio, transacciones o consultas debe tener unit tests con dependencias mockeadas o fakes.
- Todo DTO con validaciones no triviales debe tener tests de validacion o estar cubierto por e2e que pruebe entradas invalidas.
- Toda correccion de bug debe incluir un test que falle sin la correccion.
- No bajar cobertura ni eliminar tests sin reemplazo equivalente.
- Los tests deben ser deterministas: sin dependencias de red externa, tiempo real no controlado ni orden aleatorio no fijado.
- Antes de cerrar un cambio, ejecutar como minimo:
  - `pnpm typecheck`
  - `pnpm test`
  - e2e correspondiente si existe script dedicado

## Librerias y pinning

- Usar librerias oficiales de NestJS o paquetes ampliamente mantenidos antes de introducir dependencias pequenas o poco confiables.
- Justificar toda dependencia nueva en el PR o documento de cambio: problema que resuelve, alternativa considerada y superficie de mantenimiento.
- Pinear versiones exactas en `package.json`. No usar rangos como `^` o `~` para dependencias nuevas.
- Mantener `pnpm-lock.yaml` actualizado y versionado.
- No actualizar paquetes de forma masiva junto con cambios funcionales. Separar upgrades de dependencias en cambios dedicados.
- Revisar breaking changes y notas de migracion antes de subir versiones mayores.

## Documentacion y comentarios

- Preferir codigo claro, nombres precisos y funciones pequenas antes que comentarios.
- No agregar comentarios obvios en el codigo.
- Si una decision necesita contexto, documentarla en `docs/` o en el README del modulo correspondiente.
- Los comentarios en codigo se permiten solo para explicar una restriccion no evidente, una decision de seguridad, una consulta compleja o una integracion externa con comportamiento inesperado.
- Mantener ejemplos de uso, variables de entorno y comandos actualizados.

## Estilo de implementacion

- Escribir TypeScript estricto y tipado. Evitar `any`; si es inevitable, limitar su alcance y explicar el motivo.
- Mantener funciones con una responsabilidad clara.
- Usar errores HTTP de NestJS (`BadRequestException`, `NotFoundException`, etc.) en la frontera HTTP o capa de aplicacion.
- Centralizar configuracion en `ConfigModule`/`ConfigService`.
- Evitar logica de negocio en decorators, pipes o interceptors; esas piezas deben ser transversales y pequenas.
- No mezclar refactors grandes con features. Si una mejora estructural es necesaria, hacerla en commits separados.

## Checklist antes de entregar

- La estructura respeta modulo, controller, service, DTOs y persistencia definida.
- No se agrego acoplamiento innecesario ni dependencias cruzadas.
- Swagger refleja los cambios del contrato HTTP.
- Hay unit tests para cada archivo con logica modificado o creado.
- Hay e2e/integracion para endpoints nuevos o modificados.
- `pnpm typecheck` y `pnpm test` pasan.
- Dependencias nuevas estan pineadas y justificadas.
- Documentacion relevante actualizada.
