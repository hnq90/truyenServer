'use strict';

var Util = require('../lib/util');
var PDFDocument = require('pdfkit');

var User = require('../models/models').User;
var Chapter = require('../models/models').Chapter;
var Favorite = require('../models/models').Favorite;
var Manga = require('../models/models').Manga;
var Story = require('../models/models').Story;

exports.storyList = function(req, res) {
  // for (var i = 0; i < 5; i++) {
  //   var story = new Story({});
  //   story.title = 'Full story ' + i;
  //   story.author = 'Phi Quan';
  //   story.datePost = Date.now();
  //   story.type = 1;
  //   }
  //   story.save();
  // }
  Story.find({}, '_id title author datePost numView shortDes type').sort( 'title', 1 ).exec(function(error, stories) {
    if (error) {
      console.log(error);
    }
    res.json({ 'data': stories });
  });
};

exports.getStory = function(req, res) {
  Story.findOne({ '_id': req.query.id }, '_id author title datePost numView shortDes chapters.chapter chapters.title chapters._id', function(error, story) {
    if (error) {
      console.log(error);
    }
    if (story == null) {
      console.log(error);
    } else {
      if (story.numView) {
        story.numView++;
      } else {
        story.numView = 1;
      }
      story.save();
      User.findOne({ 'userId': req.query.userId }, function(error, user) {
        if (user == null) {
          res.json({ 'data': story, 'favorite': false });
        } else {
          if (Util.contain(user.favorites, 'itemId', story._id)) {
            res.json({ 'data': story, 'favorite': true });
          } else {
            res.json({ 'data': story, 'favorite': false });
          }
        }
      });
    }
  });
};

exports.getStoryContent = function(req, res) {
  Story.findOne({ '_id': req.query.id }, function(error, story) {
    if (error) {
      console.log(error);
    }
    console.log(story);
    if (story == null) {
      console.log(error);
    } else {
      if (req.query.type == 0) {
        res.json({ 'data': story });
      } else {
        var chapter = story.chapters.id(req.query.chapterId);
        res.json({ 'data': chapter });
      }
    }
  });
};

exports.mangaList = function(req, res) {
  // for (var i = 0; i < 30; i++) {
  //   var manga = new Manga({});
  //   manga.title = 'Doraemon ' + i;
  //   manga.author = 'Quan';
  //   manga.cover = '/images/manga/sample/cover2.jpg';
  //   manga.datePost = Date.now();
  //   manga.chapters = [];
  //   var chapter = null;
  //   for (var j = 0; j < 25; j++) {
  //     chapter = {
  //       'chapter': 'Chapter ' + (j+1),
  //       'title': 'Begin ' + (j+1),
  //       'numPages': 14
  //     }
  //     manga.chapters.push(chapter);
  //   }
  //   console.log(i);
  //   manga.save();
  // }
  Manga.find({}).sort( 'title', 1 ).exec(function(error, mangas) {
    if (error) {
      console.log(error);
    }
    res.json({ 'data': mangas });
  });
};

exports.manga = function(req, res) {
  Manga.findOne({ '_id': req.query.id }, function(error, manga) {
    if (error) {
      console.log(error);
    }
    if (manga == null) {
      console.log(error);
    } else {
      if (manga.numView) {
        manga.numView++;
      } else {
        manga.numView = 1;
      }
      manga.save();
      User.findOne({ 'userId': req.query.userId }, function(error, user) {
        if (user == null) {
          res.json({ 'data': manga, 'favorite': false });
        } else {
          if (Util.contain(user.favorites, 'itemId', manga._id)) {
            res.json({ 'data': manga, 'favorite': true });
          } else {
            res.json({ 'data': manga, 'favorite': false });
          }
        }
      });
    }
  });
};

exports.mangaReading = function(req, res) {
  Manga.findOne({ 'chapter.i._id': req.query.id }, function(error, chapter) {
    if (error) {
      console.log(error);
    }
    if (chapter == null) {
      console.log(error);
    } else {
      res.json({ 'data': chapter })
    }
  });
};

exports.addFavorite = function(req, res) {
  User.findOne({ 'userId': req.query.userId }, function(error, user) {
    if (error) {
      console.log(error);
    }
    if (user == null) {
      user = new User({ 'userId': req.query.userId });
      user.username = req.query.username;
      user.fullName = req.query.fullName;
      user.favorites = [];
    } else {
      user.fullName = req.query.fullName;
    }
    if (!Util.contain(user.favorites, 'itemId', req.query.itemId )) {
      user.favorites.push({ 'itemId': req.query.itemId, 'itemType': req.query.itemType });
    }
    user.save(function(error) {
      if (error) {
        console.log(error);
        res.json({ 'data': error });
      }
      res.json({ 'data': 'success' });
    })
  });
};

exports.removeFavorite = function(req, res) {
  User.findOne({ 'userId': req.query.userId }, function(error, user) {
    if (error) {
      console.log(error);
    }
    if (user == null) {
      res.json({ 'data': false });
    } else {
      for (var i = 0; i < user.favorites.length; i++) {
        if (user.favorites[i].itemId.toString() == req.query.itemId.toString()) {
          user.favorites[i].remove();
        }
      }
      user.save(function() {
        res.json({ 'data': 'success' });
      });
    }
  });
};

exports.getFavorites = function(req, res) {
  User.findOne({ 'userId': req.query.userId }, function(error, user) {
    if (error) {
      console.log(error);
    }
    if (user == null) {
      res.json({ 'data': false });
    } else {
      var favorites = {};
      var mangaIds = [];
      var storyIds = [];
      var funnyIds = [];
      for (var i = 0; i < user.favorites.length; i++) {
        var itemType = user.favorites[i].itemType;
        switch(itemType.toString()) {
          case '0':
            mangaIds.push(user.favorites[i].itemId);
            break;
          case '1':
            storyIds.push(user.favorites[i].itemId);
            break;
          case '2':
            funnyIds.push(user.favorites[i].itemId);
            break;
        }
      }
      Manga.find({ '_id': { $in: mangaIds }}).sort('title', 1).exec(function(error, mangas) {
        if (error) {
          console.log(error);
          res.json({ 'data': false });
        }
        if (mangas != null) {
          favorites['manga'] = mangas;
        }
        Story.find({ '_id': { $in: storyIds }}, '_id author title datePost numView shortDes chapters.chapter chapters.title chapters._id type').sort('title', 1).exec(function(error, stories) {
          if (error) {
            console.log(error);
            res.json({ 'data': false });
          }
          if (stories != null) {
            favorites['story'] = stories;
          }
          res.json({ 'data': favorites });
        });
      });
    }
  });
}