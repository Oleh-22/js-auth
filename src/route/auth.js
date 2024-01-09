// Підключаємо технологію express для back-end сервера
const express = require('express')
// Cтворюємо роутер - місце, куди ми підключаємо ендпоїнти
const router = express.Router()

const { User } = require('../class/user')
const { Confirm } = require('../class/confirm')
const { Session } = require('../class/session')

User.create({
  email: 'test@gmail.com',
  password: 123,
  role: 1,
})

// ================================================================

// router.get Створює нам один ентпоїнт

// ↙️ тут вводимо шлях (PATH) до сторінки
router.get('/signup', function (req, res) {
  // res.render генерує нам HTML сторінку

  // ↙️ cюди вводимо назву файлу з сontainer
  res.render('signup', {
    name: 'signup',
    component: [
      'back-button',
      'field',
      'field-password',
      'field-checkbox',
      'field-select',
    ],

    title: 'Signup page',

    data: {
      role: [
        { value: User.USER_ROLE.USER, text: 'Користувач' },
        {
          value: User.USER_ROLE.ADMIN,
          text: 'Адміністратор',
        },
        {
          value: User.USER_ROLE.DEVELOPER,
          text: 'Розробник',
        },
      ],
    },
  })
  // ↑↑ сюди вводимо JSON дані
})
//======================================================
router.post('/signup', function (req, res) {
  const { email, password, role } = req.body
  console.log(req.body)
  if (!email || !password || !role) {
    return res.status(400).json({
      message: 'Помилка. ОБовязкові поля відсутні',
    })
  }
  try {
    const user = User.getByEmail(email)
    if (user) {
      return res.status(400).json({
        message: 'Такий користувач вже існує',
      })
    }
    User.create()

    const newuser = User.create({ email, password, role })

    const session = Session.create(newuser)

    Confirm.create(newuser.email)

    return res.status(200).json({
      message: 'Користувач успішно зареєстрований',
      session,
    })
  } catch (err) {
    return res.status(400).json({
      message: 'Помилка створення користувача',
    })
  }
})

//===============================================
router.get('/recovery', function (req, res) {
  return res.render('recovery', {
    name: 'recovery',
    component: ['back-button', 'field'],
    title: 'Recovery page',
    data: {},
  })
})
//==============================================
router.post('/recovery', function (req, res) {
  const { email } = req.body
  console.log(email)

  if (!email) {
    return res.status(400).json({
      message: 'Помилка. ОБовязкові поля відсутні',
    })
  }
  try {
    const user = User.getByEmail(email)

    if (!user) {
      return res.status(400).json({
        message: 'Користувач з таким email не існує',
      })
    }

    Confirm.create(email)
    return res.status(200).json({
      message: 'Код для відновлення паролю відправлено',
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    })
  }
})
//===============================================
router.get('/recovery-confirm', function (req, res) {
  return res.render('recovery-confirm', {
    name: 'recovery-confirm',
    component: ['back-button', 'field', 'field-password'],
    title: 'Recovery confirm page',
    data: {},
  })
})
//=================================================
router.post('/recovery-confirm', function (req, res) {
  const { password, code } = req.body

  console.log(password, code)

  if (!code || !password) {
    return res.status(400).json({
      message: 'Помилка. ОБовязкові поля відсутні',
    })
  }

  try {
    const email = Confirm.getData(Number(code))
    if (!email) {
      return res.status(400).json({
        message: 'Код не існує',
      })
    }

    const user = User.getByEmail(email)
    if (!user) {
      return res.status(400).json({
        message: 'Користувач з таким емейл не існує',
      })
    }

    user.password = password

    console.log(user)

    const session = Session.create(user)

    return res.status(200).json({
      message: 'Пароль змінено',
      session,
    })
  } catch (err) {
    return res.status(400).json({
      message: err.message,
    })
  }
})

//==========================================
router.get('/signup-confirm', function (req, res) {
  const { renew, email } = req.query

  if (renew) {
    Confirm.create(email)
  }

  return res.render('signup-confirm', {
    name: 'signup-confirm',
    component: ['back-button', 'field'],
    title: 'Signup confirm page',
    data: {},
  })
})
//========================================
router.post('/signup-confirm', function (req, res) {
  const { code, token } = req.body
  if (!code || !token) {
    return res.status(400).json({
      message: 'Помилка. ОБовязкові поля відсутні',
    })
  }
  try {
    const session = Session.get(token)
    if (!session) {
      return res.status(400).json({
        message: 'Помилка. Ви не увійшли в акаунт',
      })
    }
    const email = Confirm.getData(code)
    if (!email) {
      return res.status(400).json({
        message: 'Код не існує',
      })
    }
    if (email !== session.user.email) {
      return res.status(400).json({
        message: 'Код не дійсний',
      })
    }

    session.user.isConfirm = true

    // const user = User.getByEmail(session.user.email)
    // user.isConfirm = true

    return res.status(200).json({
      message: 'Ви підтвердили свою пошту',
      session,
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    })
  }

  console.log(code, token)
})
//======================================================
router.get('/login', function (req, res) {
  return res.render('login', {
    name: 'login',
    component: ['back-button', 'field', 'field-password'],
    title: 'Login page',
    data: {},
  })
})
//========================================================
router.post('/login', function (req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      message: 'Помилка. ОБовязкові поля відсутні',
    })
  }

  try {
    const user = User.getByEmail(email)

    if (!user) {
      return res.status(400).json({
        message: 'Користувач з таким емейл не існує',
      })
    }

    if (user.password !== password) {
      return res.status(400).json({
        message: 'Помилка. Пароль не підходить',
      })
    }

    const session = Session.create(user)

    return res.status(200).json({
      message: 'Ви увійшли',
      session,
    })
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    })
  }
})

// Підключаємо роутер до бек-енду
module.exports = router
