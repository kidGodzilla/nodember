var path = require('path'),
    fs = require('fs'),
    join = path.join,
    root = require('../../root'),
    mongoose = require('mongoose'),
    Photo = mongoose.model('Photo'),
    _ = require('underscore');

exports.photo = function(req, res, next, id) {

    Photo.load(id, function(err, photo) {
        if (err) return next(err);
        if (!photo) return next(new Error('Failed to load photo ' + id));

        req.photo = photo;
        next();
    });
};

exports.index = function(req, res, next) {
    if (!_.isEmpty(req.query)) {
        Photo.query(req.query, function(err, photos) {
            if (err) return next(err);
            if (!photos) {
                res.send({
                    error: new Error('Failed to load photo for query')
                });
            } else {
                //transform to public path                
                _.map(photos, function(photo) {
                    var p = photo.path;
                    photo.path = p.substr(p.indexOf("/public") + 7, p.length);
                    return photo;
                });
                res.send({
                    photos: photos
                });
            }
        });
    } else {
        // else we find all
        Photo.find().sort('-created').populate('user', 'name username').exec(function(err, photos) {
            if (err) return next(err);
            if (!photos) {
                res.send({
                    error: new Error('Failed to load photo for query')
                });
            } else {
                //transform to public path                
                _.map(photos, function(photo) {
                    var p = photo.path;
                    photo.path = p.substr(p.indexOf("/public") + 7, p.length);
                    return photo;
                });
                res.send({
                    photos: photos
                });
            }
        });
    }
};

exports.upload = function(dir) {
    return function(req, res, next) {
        var img = req.files.file;
        var name = img.originalFilename;

        var path = join(root + '/public/img/uploads/', img.name);

        fs.rename(img.path, path, function(err) {
            if (err) return next(err);

            Photo.create({
                name: name,
                path: path
            }, function(err) {
                if (err) return next(err);
                res.redirect('/');
            });
        });
    };
};

exports.download = function(dir) {
    return function(req, res, next) {
        var id = req.params.id;
        Photo.findById(id, function(err, photo) {
            if (err) return next(err);
            var path = join(dir, photo.path);
            res.download(path, photo.name + '.jpeg');
        });
    };
};