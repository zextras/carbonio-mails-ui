/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { Shimmer } from '@zextras/zapp-ui';
import { map } from 'lodash';

const ShimmerList = () => (
	<>
		{map(Array.from(Array(15).keys()), (item, index) => (
			<Shimmer.ListItem type={1} key={`${item}${index}`} />
		))}
	</>
);

export default ShimmerList;
