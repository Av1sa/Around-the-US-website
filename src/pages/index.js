import FormValidator from "../components/FormValidator.js";
import Card from "../components/Card.js";
import Section from "../components/Section.js";
import PopupWithImage from "../components/PopupWithImage.js";
import PopupWithForm from "../components/PopupWithForm.js";
import UserInfo from "../components/UserInfo.js";
import Api from "../components/Api.js";

import "./index.css";

//Init api
const api = new Api({
  baseUrl: "https://around.nomoreparties.co/v1/group-1",
  headers: {
    authorization: "02dcf3f3-4313-4731-b00a-f80d0e88b6bf",
    "Content-Type": "application/json",
  },
});

//Profile data
const userInfo = new UserInfo({
  nameSelector: ".profile__name",
  aboutSelector: ".profile__description",
  avatarSelector: ".profile__avatar",
});

//Init popup image
const popupWithImage = new PopupWithImage(".popup_image", {
  name: "",
  link: "",
});

api
  .getAppInfo()
  .then(([cardListData, userInfoData]) => {
    //Show user info
    userInfo.setUserInfo({
      name: userInfoData.name,
      about: userInfoData.about,
      avatar: userInfoData.avatar,
      id: userInfoData._id,
    });

    //Render card
    const renderCard = (data) => {
      const card = new Card(
        {
          data: data,
          handleCardClick: ({ name, link }) => {
            popupWithImage.setFields({ name, link });
            popupWithImage.setEventListeners();
            popupWithImage.open();
          },
          handleDeleteClick: (card) => {
            confirmDeleteCardPopup
              .getFormElement()
              .querySelector(".popup__input").value = card.getId();
            confirmDeleteCardPopup.open();
          },
          handleLikeIcon: (card) => {
            let apiMethod = "";
            card._isLikedByCurrentUser
              ? (apiMethod = "DELETE")
              : (apiMethod = "PUT");
            card._isLikedByCurrentUser = !card._isLikedByCurrentUser;
            card._toggleLikeIcon(card._isLikedByCurrentUser);
            api
              .changeLikeCardStatus(card.getId(), apiMethod)
              .then((res) => card._renderLikes(res.likes.length))
              .catch((err) => `Error: ${err}`);
          },
        },
        ".template-card",
        userInfo.getUserId()
      );
      return card.generateCard();
    };

    //Show initial cards
    const cardList = new Section(
      {
        items: cardListData,
        renderer: (item) => cardList.addItem(renderCard(item)),
      },
      ".cards"
    );
    cardList.renderItems();

    //DOM selectors for validation
    const settingsObj = {
      inputSelector: ".popup__input",
      submitButtonSelector: ".button_save",
      inactiveButtonClass: "button_save-inactive",
      inputErrorClass: "popup__input_type_error",
      errorClass: "popup__input-error_active",
    };

    //Popups
    const newPlacePopup = new PopupWithForm(".popup_new-place", {
      handleFormValidation: () => {
        newPlaceValidator.enableValidation();
      },
      handleFormSubmit: (data) => {
        newPlacePopup.toggleLoading(true);
        api
          .addCard({ name: data["title-input"], link: data["link-input"] })
          .then((card) => {
            cardList.addItem(renderCard(card));
          })
          .catch((err) => `Error: ${err}`)
          .finally(() => {
            newPlacePopup.toggleLoading(false);
            newPlacePopup.close();
          });
      },
      handleInitialData: () => {},
    });

    const confirmDeleteCardPopup = new PopupWithForm(".popup_delete-card", {
      handleFormValidation: () => {},
      handleFormSubmit: (data) => {
        api
          .removeCard(data["card_id"])
          .then(() => {
            document.getElementById(data["card_id"]).remove();
          })
          .finally(() => confirmDeleteCardPopup.close());
      },
      handleInitialData: () => {},
    });

    const editProfileInputName = document.querySelector(".popup__input_name");
    const editProfileInputAbout = document.querySelector(".popup__input_desc");
    const editProfilePopup = new PopupWithForm(".popup_edit-profile", {
      handleFormValidation: () => {
        editProfileValidator.enableValidation();
      },
      handleFormSubmit: (data) => {
        editProfilePopup.toggleLoading(true);
        api
          .setUserInfo({
            name: data["name-input"],
            about: data["desc-input"],
          })
          .then((res) =>
            userInfo.setUserInfo({
              name: res.name,
              about: res.about,
              avatar: res.avatar,
              id: res._id,
            })
          )
          .catch((err) => console.log(`Error: ${err}`))
          .finally(() => {
            editProfilePopup.toggleLoading(false);
            editProfilePopup.close();
          });
      },
      handleInitialData: () => {
        const { name, about } = userInfo.getUserInfo();
        editProfileInputName.value = name;
        editProfileInputAbout.value = about;
      },
    });

    const editAvatarInputPic = document.querySelector(".popup__input_avatar");
    const editAvatarPopup = new PopupWithForm(".popup_edit-avatar", {
      handleFormValidation: () => {
        editAvatarValidator.enableValidation();
      },
      handleFormSubmit: (data) => {
        editAvatarPopup.toggleLoading(true);
        api
          .setUserAvatar({
            avatar: data["avatar-input"],
          })
          .then((res) => {
            userInfo.setUserInfo({
              name: res.name,
              about: res.about,
              avatar: res.avatar,
              id: res._id,
            });
          })
          .catch((err) => console.log(`Error: ${err}`))
          .finally(() => {
            editAvatarPopup.toggleLoading(false);
            editAvatarPopup.close();
          });
      },

      handleInitialData: () => {
        const { avatar } = userInfo.getUserInfo();
        editAvatarInputPic.value = avatar;
      },
    });

    //Set event listeners for popups
    newPlacePopup.setEventListeners();
    confirmDeleteCardPopup.setEventListeners();
    editProfilePopup.setEventListeners();
    editAvatarPopup.setEventListeners();

    //Validators
    const newPlaceValidator = new FormValidator(
      settingsObj,
      newPlacePopup.getFormElement()
    );

    const editProfileValidator = new FormValidator(
      settingsObj,
      editProfilePopup.getFormElement()
    );

    const editAvatarValidator = new FormValidator(
      settingsObj,
      editAvatarPopup.getFormElement()
    );

    //Buttons
    const editProfileBtn = document.querySelector(".button_edit");
    const editAvatarBtn = document.querySelector(".profile__avatar-container");
    const newPlaceBtn = document.querySelector(".button_add");

    //Set event listeners for buttons
    editProfileBtn.addEventListener("click", () => {
      editProfilePopup.open();
      editProfileValidator.enableValidation();
    });

    editAvatarBtn.addEventListener("click", () => {
      editAvatarPopup.open();
      editAvatarValidator.enableValidation();
    });

    newPlaceBtn.addEventListener("click", () => {
      newPlacePopup.open();
      newPlaceValidator.enableValidation();
    });
  })
  .catch((err) => `Error: ${err}`);
