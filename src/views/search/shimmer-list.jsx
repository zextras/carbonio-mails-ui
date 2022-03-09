/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';
import { Shimmer } from '@zextras/carbonio-design-system';
import { isNil, map } from 'lodash';

const ShimmerList = ({ count }) => {
	const arr = useMemo(
		() => Array.from(Array(!isNil(count) && count < 13 ? count : 13).keys()),
		[count]
	);
	return (
		<>
			{map(arr, (item, index) => (
				<Shimmer.ListItem type={1} key={`${item}${index}`} />
			))}
		</>
	);
};

export default ShimmerList;
