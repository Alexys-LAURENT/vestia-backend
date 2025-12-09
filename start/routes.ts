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

router
  .group(() => {
    router.get('', [LooksController, 'getAllForUser'])
  })
  .prefix('/looks')
