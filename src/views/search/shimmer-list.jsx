/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Shimmer, Container } from '@zextras/carbonio-design-system';
import { isNil, map, times } from 'lodash';
import styled from 'styled-components';

const ShimmerList = ({ count, delay = 0 }) => {
	const [visible, setVisibility] = useState(delay > 0 ? 'hidden' : 'visible');
	const timeoutRef = useRef();
	const itemCount = count > 33 ? 33 : count;

	// The returned callback is needed only if the timeout is really set
	// eslint-disable-next-line consistent-return
	useEffect(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		if (delay > 0) {
			timeoutRef.current = setTimeout(() => setVisibility('visible'), delay);
			return () => {
				clearTimeout(timeoutRef.current);
			};
		}
	}, [delay]);

	return (
		<Container
			mainAlignment="start"
			height="fill"
			style={{ visibility: visible, overflow: 'hidden' }}
		>
			{times(itemCount, (index) => (
				<Shimmer.ListItem type={1} key={`${index}`} />
			))}
		</Container>
	);
};

export default ShimmerList;
