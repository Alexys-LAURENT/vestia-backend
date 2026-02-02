/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const AuthController = () => import('#controllers/auth_controller/controller')
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const LooksController = () => import('#controllers/looks_controller/controller')
const ItemsController = () => import('#controllers/items_controller/controller')
const PlannedOutfitsController = () => import('#controllers/planned_outfits_controller/controller')

router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.post('/register', [AuthController, 'register'])
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
    router.post('/check-username', [AuthController, 'checkUsername'])
  })
  .prefix('/auth')

router
  .group(() => {
    router.post('/analyse', [ItemsController, 'analyseImage'])
    router.post('', [ItemsController, 'insert'])
    router.get('', [ItemsController, 'getAllForUser'])
    router.get('/:idItem', [ItemsController, 'getOne'])
    router.delete('/:idItem', [ItemsController, 'delete'])
    router.put('/:idItem', [ItemsController, 'update'])
  })
  .prefix('/items')
  .use(middleware.auth())

router
  .group(() => {
    router.get('', [LooksController, 'getAllForUser'])
    router.post('', [LooksController, 'create'])
    router.get('/:idLook', [LooksController, 'getOne'])
    router.delete('/:idLook', [LooksController, 'delete'])
    router.post('/generate', [LooksController, 'generateLook'])
  })
  .prefix('/looks')
  .use(middleware.auth())

router
  .group(() => {
    router.post('', [PlannedOutfitsController, 'create'])
    router.get('', [PlannedOutfitsController, 'getAll'])
    router.get('/:idPlannedOutfit', [PlannedOutfitsController, 'getOne'])
    router.put('/:idPlannedOutfit', [PlannedOutfitsController, 'update'])
    router.delete('/:idPlannedOutfit', [PlannedOutfitsController, 'delete'])
  })
  .prefix('/planned-outfits')
  .use(middleware.auth())
