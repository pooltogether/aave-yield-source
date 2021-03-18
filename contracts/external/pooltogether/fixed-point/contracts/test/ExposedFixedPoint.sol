// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.6.0 <0.7.0;

import "../FixedPoint.sol";

contract ExposedFixedPoint {

    function calculateMantissa(uint256 numerator, uint256 denominator) external pure returns (uint256) {
        return FixedPoint.calculateMantissa(numerator, denominator);
    }

    function multiplyUintByMantissa(uint256 b, uint256 mantissa) external pure returns (uint256) {
        return FixedPoint.multiplyUintByMantissa(b, mantissa);
    }

    function divideUintByMantissa(uint256 dividend, uint256 mantissa) external pure returns (uint256) {
        return FixedPoint.divideUintByMantissa(dividend, mantissa);
    }
}
