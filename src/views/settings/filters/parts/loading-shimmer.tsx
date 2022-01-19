/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';
import { Container, Shimmer } from '@zextras/carbonio-design-system';

const LoadingShimmer: FC = (): ReactElement => (
	<Container
		orientation="horizontal"
		mainAlignment="flex-start"
		width="fill"
		crossAlignment="flex-start"
	>
		<Shimmer.FormSection>
			<Shimmer.FormSubSection />
		</Shimmer.FormSection>
	</Container>
);

export default LoadingShimmer;
