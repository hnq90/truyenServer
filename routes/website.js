'use strict';

var Util = require('../lib/util');
var email   = require('emailjs/email');
var request = require('request');

var User = require('../models/models').User;
var Chapter = require('../models/models').Chapter;
var Favorite = require('../models/models').Favorite;
var Manga = require('../models/models').Manga;
var Story = require('../models/models').Story;

var mainCateList = {
  listStory: {
    text: "Sách truyện",
    subCate: [],
    link: "/w/stories/1/4/des"
  },
  listManga: {
    text: "Truyện tranh",
    subCate: [],
    link: "/w/stories/1"
  },
  listAudio: {
    text: "Radio",
    subCate: [],
    link: "/w/stories/1"
  },
  news: {
    text: "Điểm tin",
    subCate: [],
    link: "/w/stories/1"
  },
  shareEmotion: {
    text: "Góc nhỏ tâm hồn",
    subCate: ["poetry", "shortStory", "experience"],
    link: "/w/stories/1"
  },
  contactUs: {
    text: "Liên hệ",
    subCate: [],
    link: "/w/stories/1"
  }
}

var subCateList = {
  poetry: {
    text: "Thơ",
    link: "#"
  },
  shortStory: {
    text: "Truyện ngắn",
    link: "#"
  },
  experience: {
    text: "Trải nghiệm",
    link: "#"
  }
}

var category = {
  mainCateList: mainCateList,
  subCateList: subCateList
}
// page for paging story list
var numPage = 30;
var maxStoryPage;

var sliderBooks;
Story.find({}, '_id title author shortDes cover').skip(0).limit(30).exec(function(error, stories) {
  sliderBooks = stories;
});

var newBooks;

var listBooks;
Story.find({}, '_id title author cover cate updatedAt datePost numView').exec(function(error, stories) {
  listBooks = stories;
  maxStoryPage = Math.ceil(listBooks.length / numPage);
});

function getBooksByCate(cateType, bookId) {
  var books = [];
  for (var i = 0; i < listBooks.length; i++) {
    if (listBooks[i].cate.indexOf(cateType) != -1 && listBooks[i]._id.toString() != bookId.toString()) {
      books.push(listBooks[i]);
    }
  }
  return books;
}

exports.contactUs = function(req, res) {
  res.render('contactUs', { 
    title: 'Full Truyện',
    error: '',
    category: category
  });
};

exports.homePage = function(req, res) {
  res.render('index', { 
    title: 'Full Truyện',
    error: '',
    category: category,
    sliderBooks: sliderBooks
  });
};

exports.listStories = function(req, res) {
  var stories;
  switch(req.params.orderType) {
    case "0": // title
      stories = listBooks.slice(0).sort(Util.dynamicSort('title', req.params.orderStyle == "asc" ? 1 : -1));
    break;
    case "1": // author
      stories = listBooks.slice(0).sort(Util.dynamicSort('author', req.params.orderStyle == "asc" ? 1 : -1));
    break;
    case "2": // type
      stories = listBooks.slice(0).sort(Util.dynamicSort('cate', req.params.orderStyle == "asc" ? 1 : -1));
    break;
    case "3": // view
      stories = listBooks.slice(0).sort(Util.dynamicSort('numView', req.params.orderStyle == "asc" ? 1 : -1));
    break;
    case "4": // date post
    default: // datepost
      stories = listBooks.slice(0).sort(Util.dynamicSort('datePost', req.params.orderStyle == "asc" ? 1 : -1));
  }
  res.render('listStory', { 
    title: 'Full Truyện',
    error: '',
    category: category,
    totalPage: 5,
    stories: stories.splice(numPage * (parseInt(req.params.page) - 1), numPage),
    orderType: req.params.orderType,
    orderStyle: req.params.orderStyle,
    maxStoryPage: maxStoryPage,
    currentPage: parseInt(req.params.page),
    storyTypes: Util.storyCate
  });
};

exports.getStory = function(req, res) {
  Story.findOne({ '_id': req.params.storyId }, '_id author cover source poster translator status title datePost cate numView shortDes chapters.chapter chapters.title chapters._id').exec(function(error, story) {
    var suggestCate = story.cate.randomElement();
    var suggestBooks;
    if (suggestCate) {
      suggestBooks = getBooksByCate(suggestCate, story._id);
      suggestBooks.sort(Util.dynamicSort('datePost', -1));
      suggestBooks = suggestBooks.slice(0, 10);
    }
    story.chapters.sort(Util.dynamicSort('chapter', -1));
    res.render('story', { 
      title: 'Full Truyện',
      error: '',
      category: category,
      story: story,
      suggestBooks: suggestBooks
    });
  });
};

exports.getStoryChapter = function(req, res) {
  Story.findOne({ '_id': req.params.storyId }).exec(function(error, story) {
    story.chapters.sort(Util.dynamicSort('chapter', 1));
    var chapter = story.chapters.id(req.params.storyChapterId);
    res.render('storyReading', { 
      title: 'Full Truyện',
      error: '',
      category: category,
      story: story,
      chapter: chapter
    });
  });
}