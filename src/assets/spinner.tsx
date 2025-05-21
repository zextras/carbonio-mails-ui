/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Spinner as SpinnerDS, Text, Padding } from '@zextras/carbonio-design-system';

export const Spinner = ({ text }: { text?: string }): React.JSX.Element => (
	<Container>
		<SpinnerDS color={'primary'} />
		{text && (
			<>
				<Padding top={'small'} />
				<Text color={'secondary'} size={'extrasmall'}>
					{text}
				</Text>
			</>
		)}
	</Container>
);
