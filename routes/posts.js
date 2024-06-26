const express = require('express');
const router = express.Router();

const Post = require('../models/postsModel')
const User = require('../models/usersModel')
const Comment = require('../models/commentsModel')
const appError = require('../service/appError')
const handleErrorAsync = require('../service/handleErrorAsync')
const { isAuth } = require('../service/auth')


//取得所有貼文
router.get('/', handleErrorAsync(async(req, res, next) => {
    const timeSort = req.query.timeSort == "asc" ? "createdAt":"-createdAt"
    const q = req.query.q !== undefined ? {"content": new RegExp(req.query.q)} : {};
    const posts = await Post.find(q)
    .populate({
      path: 'user',
      select: 'name photo email'
    }).populate({
      path: 'comments',
      select: 'comment user',
    }).sort(timeSort);
  // asc 遞增(由小到大，由舊到新) createdAt ; 
  // desc 遞減(由大到小、由新到舊) "-createdAt"
    res.status(200).json({
      posts
    })
}))
//取得個人貼文
router.get('/user/:id', handleErrorAsync(async(req, res, next) =>  {
  const user = req.params.id;
  const posts = await Post.find({user}).populate({
    path: 'comments',
    select: 'comment user'
  });

  res.status(200).json({
      status: 'success',
      results: posts.length,
      posts
  });
}))
//新增貼文
router.post('/',isAuth ,handleErrorAsync(async(req, res, next) => {
  const {content} = req.body
  if(content == undefined){
    return next(appError(400,"你沒有填寫 content 資料"))
  }
    const newPost = await Post.create({
      user: req.user.id,
      content
    })
    res.status(200).json({
      "message":"success",
      posts:newPost
    })
}))
//新增留言
router.post('/:id/comment',isAuth, handleErrorAsync(async(req, res, next) =>  {
  const user = req.user.id;
  const post = req.params.id;
  const {comment} = req.body;
  const newComment = await Comment.create({
    user,
    post,
    comment
  });
  res.status(201).json({
      status: 'success',
      data: {
        comments: newComment
      }
  });

}))
//按讚
router.post('/:id/like',isAuth, handleErrorAsync(async function(req, res, next) {
  const _id = req.params.id;
    await Post.findOneAndUpdate(
        { _id},
        { $addToSet: { likes: req.user.id } }
      );
      res.status(201).json({
        status: 'success',
        postId: _id,
        userId: req.user.id
      });
}));
//取消讚
router.delete('/:id/unlike',isAuth, handleErrorAsync(async(req, res, next) =>  {
  const _id = req.params.id;
  await Post.findOneAndUpdate(
      { _id},
      { $pull: { likes: req.user.id } }
    );
    res.status(201).json({
      status: 'success',
      postId: _id,
      userId: req.user.id
    });
}))
//刪除全部貼文
router.delete("/",handleErrorAsync(async (req, res) => {
    const delAllPost = await Post.deleteMany({});
    res.json({
      status: 'success',
      posts: delAllPost
    })
  })
);
//刪除指定貼文
router.delete('/:id',handleErrorAsync(async(req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id)
  res.json({
    status: 'success',
    posts: post
  })
}))
//更改貼文
router.patch('/:id',handleErrorAsync(async(req, res) => {
  const {id} = req.params
  const {body} = req
  const updatedPost = await Post.findByIdAndUpdate(id, body, {new: true})
  res.json({
    status: 'success',
    posts: updatedPost
  })
 
}))

module.exports = router;
