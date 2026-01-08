import { AUTO, Game } from 'phaser';
import { Scale } from 'phaser';
const { CENTER_BOTH, FIT } = Scale;

import Boot from "./scenes/boot";
import Preloader from './scenes/preloader';

import TextOnlyScene from "./scenes/gameLoop/textOnlyScene";

// Escena 1
import Scene1Classroom from "./scenes/gameLoop/scene1/scene1Classroom";
import Scene1Break from "./scenes/gameLoop/scene1/scene1Break";
import Scene1Lunch1 from "./scenes/gameLoop/scene1/scene1Lunch1";
import Scene1Bedroom1 from "./scenes/gameLoop/scene1/scene1Bedroom1";
import Scene1Lunch2 from "./scenes/gameLoop/scene1/scene1Lunch2";
import Scene1Bedroom2 from "./scenes/gameLoop/scene1/scene1Bedroom2";

// Escena 2
import Scene2Break from "./scenes/gameLoop/scene2/scene2Break";
import Scene2Bedroom from "./scenes/gameLoop/scene2/scene2Bedroom";

// Escena 3
import Scene3Break from "./scenes/gameLoop/scene3/scene3Break";
import Scene3Bedroom from "./scenes/gameLoop/scene3/scene3Bedroom";

// Escena 4
import Scene4Frontyard from "./scenes/gameLoop/scene4/scene4Frontyard";
import Scene4Backyard from "./scenes/gameLoop/scene4/scene4Backyard";
import Scene4Garage from "./scenes/gameLoop/scene4/scene4Garage";
import Scene4Bedroom from "./scenes/gameLoop/scene4/scene4Bedroom";

// Escena 5
import Scene5Livingroom from "./scenes/gameLoop/scene5/scene5Livingroom";
import Scene5Bedroom from "./scenes/gameLoop/scene5/scene5Bedroom";


// Escena 6
import Scene6Livingroom from "./scenes/gameLoop/scene6/scene6Livingroom";
import Scene6Bedroom from "./scenes/gameLoop/scene6/scene6Bedroom";
import Scene6BedroomRouteA1 from "./scenes/gameLoop/scene6/routeA/scene6BedroomRouteA1";
import scene6BedroomRouteA2 from "./scenes/gameLoop/scene6/routeA/scene6BedroomRouteA2";
import Scene6LunchRouteA from "./scenes/gameLoop/scene6/routeA/scene6LunchRouteA";
import Scene6PortalRouteA from "./scenes/gameLoop/scene6/routeA/scene6PortalRouteA";
import Scene6EndingRouteA from "./scenes/gameLoop/scene6/routeA/scene6EndingRouteA";

import Scene6LunchRouteB from "./scenes/gameLoop/scene6/routeB/scene6LunchRouteB";
import Scene6BedroomRouteB from "./scenes/gameLoop/scene6/routeB/scene6BedroomRouteB";
import Scene6PoliceStationRouteB from "./scenes/gameLoop/scene6/routeB/scene6PoliceStationRouteB";
import Scene6EndingRouteB from "./scenes/gameLoop/scene6/routeB/scene6EndingRouteB";

// Escena 7
import Scene7Bedroom from "./scenes/gameLoop/scene7/scene7Bedroom";

// UI
import UIManager from './managers/UIManager';

// Menus
import TitleScene from "./scenes/menus/titleScene";
import LoginScene from "./scenes/menus/loginScene";
import CreditsScene from "./scenes/menus/creditsScene";

// Ordenador
import Computer from "./computer/computer";

const max_w = 1600, max_h = 900, min_w = 320, min_h = 240;
const config = {
    width: max_w,
    height: max_h,
    backgroundColor: '#000000',
    version: "1.0",

    type: AUTO,
    // Nota: el orden de las escenas es relevante, y las que se encuentren antes en el array se renderizaran por debajo de las siguientes
    scene: [
        // Carga de assets
        Boot,
        Preloader,

        // Menus
        TitleScene, LoginScene, CreditsScene,

        // Escena 1
        Scene1Classroom, Scene1Break, Scene1Lunch1, Scene1Bedroom1, Scene1Lunch2, Scene1Bedroom2,
        // Escena 2
        Scene2Break, Scene2Bedroom,
        // Escena 3
        Scene3Break, Scene3Bedroom,
        // Escena 4
        Scene4Frontyard, Scene4Backyard, Scene4Garage, Scene4Bedroom,
        // Escena 5
        Scene5Livingroom, Scene5Bedroom,
        // Escena 6
        Scene6Livingroom, Scene6Bedroom,
        Scene6BedroomRouteA1, scene6BedroomRouteA2, Scene6LunchRouteA, Scene6PortalRouteA, Scene6EndingRouteA,
        Scene6LunchRouteB, Scene6BedroomRouteB, Scene6PoliceStationRouteB, Scene6EndingRouteB,
        // Escena 7
        Scene7Bedroom,

        // Ordenador
        Computer,

        // UI
        UIManager, TextOnlyScene
    ],
    autoFocus: true,
    // Desactivar que aparezca el menu de inspeccionar al hacer click derecho
    disableContextMenu: true,
    render: {
        antialias: true,
    },
    scale: {
        autoCenter: CENTER_BOTH,   // CENTER_BOTH, CENTER_HORIZONTALLY, CENTER_VERTICALLY
        mode: FIT,                 // ENVELOP, FIT, HEIGHT_CONTROLS_WIDTH, NONE, RESIZE, WIDTH_CONTROLS_HEIGHT
        min: {
            width: min_w,
            height: min_h
        },
        max: {
            width: max_w,
            height: max_h,
        },
        zoom: 1,
        // parent: 'game',
    },
}

const StartGame = (parent) => {
    const game = new Game({ ...config, parent });

    game.debug = {
        enable: false,
        color: '0x00ff00'
    }
    return game
}

export default StartGame;
