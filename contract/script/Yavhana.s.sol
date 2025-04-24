// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {YavhanaTipping, YavhanaContentRegistry} from "../src/Yavhana.sol";

contract YavhanaScript is Script {
    YavhanaTipping public yavhanaTipping;
    YavhanaContentRegistry public yavhanaContentRegistry;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        tipping = new YavhanaTipping();
        registry = new YavhanaContentRegistry();

        vm.stopBroadcast();
    }
}
