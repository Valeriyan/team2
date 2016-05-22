const stageCommentsFunctions = require('../stage_comments/stage_comments');
const likesFunctions = require('../../blocks/likes/fullQuestLikes.js');

const geolib = require('geolib');
const render = require('../stage/stage.hbs');

if (!navigator.geolocation) {
    showError({ text: 'Ваш браузер не поддерживает геолокацию' });
} else {
    $('button.checkin').on('click', checkinButtonHandler);
}

function checkinButtonHandler(e) {
    const form = $(this).parents('.stage-checkin');
    let stageId = form.find('[name="stageID"]').val() || 1;
    let questId = form.find('[name="questID"]').val() || 1;
    let photo = form.find('[name="photo"]').val();
    let done = form.find('[name="done"]').val() === 'true';
    let name = form.find('[name="name"]').val();
    let description = form.find('[name="description"]').val();
    let likesCount = parseInt(form.find('[name="likesCount"]').val());
    let dislikesCount = parseInt(form.find('[name="dislikesCount"]').val());
    let commentsCount = parseInt(form.find('[name="commentsCount"]').val()) || 0;
    let $button = $(this);

    $('#checkin-modal').modal(); // Активируем модальное окно
    $('#checkin-modal').modal('show');
    $('#checkin-modal').scrollTop(0);

    $('#checkin-modal').on('hidden.bs.modal', function (e) {
        $(this).find('.modal-body p').text('Подождите пожалуйста...');
    });

    navigator.geolocation.getCurrentPosition(
        function (position) {
            let latitude = position.coords.latitude;
            let longitude = position.coords.longitude;
            const data = {
                questId: questId,
                stageId: stageId,
                latitude,
                longitude
            };
            $.ajax({
                url: '/stages/checkins',
                type: 'POST',
                data: data
            }).done(function (result) {
                console.log(result);
                let modalBody = $('#checkin-modal').find('.modal-body p');
                let text;
                switch (result.checkin) {
                    case true:
                        text = 'Поздравляем! Вы успешно прошли этап квеста!';
                        done = true;
                        $button.parents('.stage-block').after($.parseHTML(render({
                            stageId,
                            questId,
                            photo,
                            done,
                            name,
                            description,
                            likesCount,
                            dislikesCount,
                            commentsCount
                        })));

                        let changedStage = $button.parents('.stage-block').next().get(0);

                        stageCommentsFunctions.setShowCommentsHandler(changedStage);
                        likesFunctions.setHandlers(changedStage);

                        $button.parents('.stage-block').remove();
                        break;
                    default:
                        text = 'Извините, но вы вне радиуса' + '' +
                            ' принятия отметки. Попробуйте подойти ближе';
                }
                modalBody.text(text);
                if (checkDone()) {
                    console.log(questId);
                    $.ajax({
                        url: '/quests/done',
                        type: 'POST',
                        data: {
                            questId: questId
                        }
                    }).done(function (res) {
                        $('#checkin-modal').hide();
                        let modalBody = $('#checkin-modal').find('.modal-body p');
                        let text;
                        text = 'Поздравляем! Вы успешно завершили квест, так держать!';
                        modalBody.text(text);
                        $('#checkin-modal').show();
                    }).fail(function (err) {
                        console.log(err);
                    });
                }
            }).fail(function (err) {
                let modalBody = $('#checkin-modal').find('.modal-body p');
                let text;
                switch (err.status) {
                    case 401:
                        text = 'Извините, но отмечать этап' +
                            ' могут только авторизованные пользователи.';
                        break;
                    default:
                        text = 'Извините, произошла внутренняя' +
                            ' ошибка сервиса, попробуйте еще раз';
                }
                modalBody.text(text);
            });
        },
        function (err) {
            let modalBody = $('#checkin-modal').find('.modal-body p');
            modalBody.text('Извините, мы не смогли получить данные о местоположении');
        },
        {
            enableHighAccuracy: true
        }
    );
}

function checkDone() {
    return $('.stage-checkin__button').length === 0;
}

(() => {
    const images = document.getElementsByClassName('stage-photo__img');

    Array.prototype.forEach.call(images, (image) => {
        image.addEventListener('click', showImage);
    });
})();

function showImage(e) {
    if (innerWidth <= 768) {
        return;
    }
    e.preventDefault();
    const index = e.target.dataset.index;

    $(`#stage-modal-${index}`).modal('show');
}

module.exports = {
    checkinButtonHandler
};
