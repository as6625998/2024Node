const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const handleErrorAsync = require('../service/handleErrorAsync');
const User = require('../models/usersModel');
const Post = require('../models/postsModel');
const appError = require('../service/appError');
const router = express.Router();
const {isAuth,generateSendJWT} = require('../service/auth')

//會員註冊
router.post('/sign_up', handleErrorAsync(async(req,res,next) => {
  let { email,password,confirmPassword,name } = req.body;
  //內容不可為空
  if(!email||!password||!confirmPassword||!name){
    return next(appError('400','欄位未填寫正確!',next));
  }
  //密碼正確
  if(password!==confirmPassword){
    return next(appError('400','密碼不一致',next));
  }
  //密碼 8碼以上
  if(!validator.isLength(password,{min:8})){
    return next(appError('400','密碼字數低於8碼',next));
  }
  //是否為Email
  if(!validator.isEmail(email)){
    return next(appError('400','Email格式不正確',next))
  }

  //加密密碼
  password = await bcrypt.hash(req.body.password,12);
  const newUser = await User.create({
    email,
    password,
    name
  });
  generateSendJWT(newUser,200,res)
}));
//會員登入
router.post('/sign_in',handleErrorAsync(async(req,res,next)=>{
  const { email, password } = req.body;
  if (!email || !password) {
    return next(appError( 400,'帳號密碼不可為空',next));
  }
  const user = await User.findOne({ email }).select('+password');
  const auth = await bcrypt.compare(password, user.password);
  if(!auth){
    return next(appError(400,'您的密碼不正確',next));
  }
  generateSendJWT(user,200,res);
}))
//取得資料
router.get('/profile',isAuth ,handleErrorAsync(async(req,res) => {
  res.status(200).json({
    status: 'success',
    user: req.user
  })
}))
//更新密碼
router.patch('/updatePassword',isAuth ,handleErrorAsync(async(req,res,next) => {
  const {password,confirmPassword} = req.body;
  if(password!==confirmPassword){
    return next(appError('400','密碼不一致!',next))
  }
  newPassword = await bcrypt.hash(password,12);

  const user = await User.findByIdAndUpdate(req.user.id,{
    password:newPassword
  });
  generateSendJWT(user,200,res)
}))
//更新個人資料
router.patch('/profile',isAuth ,handleErrorAsync(async(req,res,next) => {
  const { name,photo } = req.body
  if(!name){
    return next(appError('400','請填寫修改姓名',next))
  }
  const user = await User.findByIdAndUpdate(req.user.id,{
    name,
    photo
  }
)
  generateSendJWT(user,200,res)
}))
//取毒案讚列表
router.get('/getLikeList',isAuth, handleErrorAsync(async(req, res, next) =>{

  const likeList = await Post.find({
    likes: { $in: [req.user.id] }
  }).populate({
    path:"user",
    select:"name _id"
  });
  res.status(200).json({
    status: 'success',
    likeList
  });
}))
//追蹤朋友
router.post('/:id/follow',isAuth, handleErrorAsync(async(req, res, next) =>{

  if (req.params.id === req.user.id) {
    return next(appError(401,'您無法追蹤自己',next));
  }
  await User.updateOne(
    {
      _id: req.user.id,
      'following.user': { $ne: req.params.id }
    },
    {
      $addToSet: { following: { user: req.params.id } }
    }
  );
  await User.updateOne(
    {
      _id: req.params.id,
      'followers.user': { $ne: req.user.id }
    },
    {
      $addToSet: { followers: { user: req.user.id } }
    }
  );
  res.status(200).json({
    status: 'success',
    message: '您已成功追蹤！'
  });
}))
//取消追蹤
router.delete('/:id/unfollow',isAuth, handleErrorAsync(async(req, res, next) =>{

  if (req.params.id === req.user.id) {
    return next(appError(401,'您無法取消追蹤自己',next));
  }
  await User.updateOne(
    {
      _id: req.user.id
    },
    {
      $pull: { following: { user: req.params.id } }
    }
  );
  await User.updateOne(
    {
      _id: req.params.id
    },
    {
      $pull: { followers: { user: req.user.id } }
    }
  ); 
    res.status(200).json({
    status: 'success',
    message: '您已成功取消追蹤！'
  });
}))
//追蹤名單
// routes/users.js
router.get('/following', isAuth, handleErrorAsync(async (req, res, next) =>{
  const followList = await User.find({
    _id: req.user.id
  }).select('following');

  res.status(200).json({
    status: 'success',
    followList
  });
}));

module.exports = router;
