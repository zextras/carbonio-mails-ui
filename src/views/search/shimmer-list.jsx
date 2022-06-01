/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Shimmer, Container } from '@zextras/carbonio-design-system';
import { isNil, map, times } from 'lodash';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
	0% { opacity: 0 }
  100% { opacity: 1 }
`;

const Wrapper = styled(Container)`
	opacity: 0;
	animation-name: ${fadeIn};
	animation-timing-function: ease-in;
	animation-fill-mode: forwards;
	overflow: hidden;
`;

const ShimmerList = ({ count, delay = 0, transitionDuration = 400 }) => {
	const itemCount = count > 33 ? 33 : count;

	return (
		<Wrapper
			mainAlignment="start"
			height="fill"
			style={{ animationDelay: `${delay}ms`, animationDuration: `${transitionDuration}ms` }}
		>
			{times(itemCount, (index) => (
				<Shimmer.ListItem type={1} key={`${index}`} />
			))}
		</Wrapper>
	);
};

export default ShimmerList;
