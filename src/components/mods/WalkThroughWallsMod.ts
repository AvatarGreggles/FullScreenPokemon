import { ICallbackRegister, IMod } from "modattachr";

import { FullScreenPokemon } from "../../FullScreenPokemon";
import { IThing } from "../Things";

import { ModComponent } from "./ModComponent";

/**
 * Mod to allow the trainer to walk through walls.
 */
export class WalkThroughWallsMod<TEightBittr extends FullScreenPokemon> extends ModComponent<TEightBittr> implements IMod {
    /**
     * Name of the mod.
     */
    public static readonly modName: string = "Walk Through Walls";

    /**
     * Mod events, keyed by name.
     */
    public readonly events: ICallbackRegister = {
        [this.eventNames.onModEnable]: (): void => {
            this.eightBitter.objectMaker.getPrototypeOf<IThing>(this.eightBitter.groups.names.solid).collide = (): boolean => true;
        },
        [this.eventNames.onModDisable]: (): void => {
            this.eightBitter.objectMaker.getPrototypeOf<IThing>(this.eightBitter.groups.names.solid).collide = (): boolean => false;
        },
    };
}
