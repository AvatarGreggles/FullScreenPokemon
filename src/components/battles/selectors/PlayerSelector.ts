import { component } from "babyioc";
import { BattleOutcome, IMove, IOnChoice, ISelector, Team } from "battlemovr";
import { GeneralComponent } from "eightbittr";

import { FullScreenPokemon } from "../../../FullScreenPokemon";
import { IBattleInfo, IPokemon } from "../../Battles";
import { IInventoryListing } from "../../menus/Items";

import { Switching } from "./player/Switching";

/**
 * Selector for a player's battle actions.
 */
export class PlayerSelector<TEightBittr extends FullScreenPokemon> extends GeneralComponent<TEightBittr> implements ISelector {
    /**
     * Menu interface for the player choosing whether to switch Pokemon.
     */
    @component(Switching)
    private readonly switching: Switching<TEightBittr>;

    /**
     * Reacts to an actor getting knocked out.
     *
     * @param battleInfo   State for an ongoing battle.
     * @param team   Which team is selecting an action.
     * @param onChoice   Callback for when this is done.
     */
    public afterKnockout(battleInfo: IBattleInfo, team: Team, onComplete: () => void): void {
        const remaining: boolean = battleInfo.teams[Team[team]].actors
            .filter((actor: IPokemon): boolean =>
                actor.statistics.health.current !== 0)
            .length > 0;

        if (remaining) {
            this.switching.offerSwitch(team, onComplete);
        } else {
            this.eightBitter.battleMover.stopBattle(
                team === Team.opponent
                    ? BattleOutcome.playerVictory
                    : BattleOutcome.opponentVictory);
        }
    }

    /**
     * Determines the next action to take.
     *
     * @param battleInfo   State for an ongoing battle.
     * @param team   Which team is taking action.
     * @param onChoice   Callback for when an action is chosen.
     */
    public nextAction(battleInfo: IBattleInfo, team: Team, onChoice: IOnChoice): void {
        this.resetGui(battleInfo, team, onChoice);
    }

    /**
     * Resets the battle options menus.
     *
     * @param battleInfo   State for an ongoing battle.
     * @param team   The player's battle team.
     * @param onChoice   Callback for when an action is chosen.
     */
    private resetGui(battleInfo: IBattleInfo, team: Team, onChoice: IOnChoice): void {
        this.eightBitter.menuGrapher.createMenu("GeneralText");
        this.eightBitter.menuGrapher.createMenu("BattleOptions");
        this.eightBitter.menuGrapher.addMenuList("BattleOptions", {
            options: [
                {
                    text: "FIGHT",
                    callback: (): void => this.openBattleMovesMenu(battleInfo, onChoice),
                },
                {
                    text: "ITEM",
                    callback: (): void => this.openBattleItemsMenu(onChoice),
                },
                {
                    text: ["Poke", "Mon"],
                    callback: (): void => this.switching.openBattlePokemonMenu(
                        team,
                        onChoice,
                        (): void => this.resetGui(battleInfo, team, onChoice)),
                },
                {
                    text: "RUN",
                    callback: (): void => this.attemptToFlee(battleInfo, team, onChoice),
                },
            ],
        });
        this.eightBitter.menuGrapher.setActiveMenu("BattleOptions");
    }

    /**
     * Opens the in-battle moves menu.
     *
     * @param battleInfo   State for an ongoing battle.
     * @param onChoice   Callback for when an action is chosen.
     */
    private openBattleMovesMenu(battleInfo: IBattleInfo, onChoice: IOnChoice): void {
        const moves: IMove[] = battleInfo.teams.player.selectedActor.moves;
        const options: any[] = moves.map((move: IMove): any =>
            ({
                text: move.title.toUpperCase(),
                callback: (): void => {
                    onChoice({
                        move: move.title,
                        type: "move",
                    });
                },
            }));

        for (let i: number = moves.length; i < 4; i += 1) {
            options.push({
                text: "-",
            });
        }

        this.eightBitter.menuGrapher.createMenu("BattleFightList");
        this.eightBitter.menuGrapher.addMenuList("BattleFightList", { options });
        this.eightBitter.menuGrapher.setActiveMenu("BattleFightList");
    }

    /**
     * Opens the in-battle items menu.
     *
     * @param battleInfo   State for an ongoing battle.
     * @param onChoice   Callback for when an action is chosen.
     */
    private openBattleItemsMenu(onChoice: IOnChoice): void {
        this.eightBitter.menus.items.open({
            backMenu: "BattleOptions",
            container: "Battle",
            disableTossing: true,
            onUse: (listing: IInventoryListing): void => {
                onChoice({
                    item: listing.item,
                    type: "item",
                });
            },
        });
    }

    /**
     * Chooses to attempt to flee the battle.
     *
     * @param battleInfo   State for an ongoing battle.
     * @param team   The player's battle team.
     * @param onChoice   Callback for when an action is chosen.
     */
    private attemptToFlee(battleInfo: IBattleInfo, team: Team, onChoice: IOnChoice): void {
        // This is only allowed if the opposing team is "wild" (doesn't have a trainer)
        if (!battleInfo.teams.opponent.leader) {
            onChoice({
                type: "flee",
            });
            return;
        }

        this.eightBitter.menuGrapher.createMenu("GeneralText", {
            backMenu: "BattleOptions",
            deleteOnFinish: true,
        });
        this.eightBitter.menuGrapher.addMenuDialog(
            "GeneralText",
            "No! There's no running from a trainer battle!",
            () => this.resetGui(battleInfo, team, onChoice),
        );
        this.eightBitter.menuGrapher.setActiveMenu("GeneralText");
    }
}
