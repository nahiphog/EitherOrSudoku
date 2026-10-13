// GPL-3.0-or-later source derived from AImenes/sudokUI.  These namespace
// imports intentionally keep every requested family available to the app.
import * as singles from "./sudokui/techniques/singles";
import * as intersections from "./sudokui/techniques/intersections";
import * as subsets from "./sudokui/techniques/subsets";
import * as fish from "./sudokui/techniques/fish";
import * as complexFish from "./sudokui/techniques/complexFish";
import * as singleDigit from "./sudokui/techniques/singleDigit";
import * as wings from "./sudokui/techniques/wings";
import * as als from "./sudokui/techniques/als";

export const classicTechniqueModules = { singles, intersections, subsets, fish, complexFish, singleDigit, wings, als };
