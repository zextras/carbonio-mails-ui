/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useMemo } from 'react';
import { Shimmer, Container } from '@zextras/carbonio-design-system';
import { isNil, map, times } from 'lodash';
import styled from 'styled-components';

const ShimmerList = ({ count }) => (
	<Container mainAlignment="start" height="fill" style={{ overflow: 'hidden' }}>
		{times(33, (index) => (
			<Shimmer.ListItem type={1} key={`${index}`} />
		))}
	</Container>
);

export default ShimmerList;
