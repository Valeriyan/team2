'use strict';

const Promise = require('bluebird');
const fs = require('fs');
const layouts = require('handlebars-layouts');
const Quest = require('../models/quests');
const Stage = require('../models/stages');
const mongoose = require('mongoose');
const User = require('../models/user');
const QuestStatus = require('../models/questsStatus');

const handlebars = require('hbs').handlebars;
handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('base', fs.readFileSync('./bundles/base.hbs', 'utf8'));

exports.quests = (req, res) => {
    Quest.getQuestsData(req, {}, 9)
        .then(data => {
            if (data.quests.length < 9) {
                data.noMoreQuests = true;
            } else {
                data.quests.pop();
            }

            res.render('quests/quests', Object.assign(data, req.commonData));
        })
        .catch(err => {
            console.log(err);
            req.commonData.errors.push({
                text: 'Some errors with getting quest'
            });
            res.redirect('/');
        });
};

exports.index = (req, res) => {
    const data = {
        currentCity: 'Екатеринбург'
    };

    res.render('main/main', Object.assign(data, req.commonData));
};

exports.newQuest = (req, res) => {
    if (!req.commonData.user) {
        req.commonData.errors.push({
            text: 'Авторизуйтесь, чтобы добавлять квесты'
        });
        res.redirect('/');

        return;
    }

    res.render('questAddition/questAddition', req.commonData);
};

exports.editQuest = (req, res) => {
    if (!req.commonData.user) {
        req.commonData.errors.push({
            text: 'Авторизуйтесь, чтобы изменять квесты'
        });
        res.redirect('/');

        return;
    }

    if (!req.params.id) {
        req.commonData.errors.push({
            text: 'Не указан id квеста'
        });
        res.redirect('/');

        return;
    }

    let query = {
        _id: req.params.id
    };

    Quest.findOne(query).exec()
        .then(quest => {
            if (!quest) {
                req.commonData.errors.push({
                    text: 'Такой квест не найден'
                });

                return Promise.reject(new Error('Квест с таким id не найден'));
            }

            if (!quest.author.equals(req.commonData.user.mongo_id)) {
                req.commonData.errors.push({
                    text: 'Нельзя менять чужие квесты'
                });

                return Promise.reject(new Error('id автора квеста не совпадает с id пользователя'));
            }

            return quest;
        })
        .then(quest => {
            let query = {
                questId: quest.id
            };

            return Stage.find(query).exec()
                .then(stages => {
                    quest.stages = stages.sort((stage1, stage2) => stage1.order - stage2.order);

                    return { quest: quest };
                });
        })
        .then(data => {
            res.render('questAddition/questAddition', Object.assign(data, req.commonData));
        })
        .catch(err => {
            console.log(err);
            res.redirect('/');
        });

};

exports.error404 = (req, res) => res.sendStatus(404);

const checkLoggedIn = (req) => {
    if (!req.user) {
        req.commonData.errors.push({
            text: 'You are not logged in'
        });
    }
};
