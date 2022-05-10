/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { Text, Tooltip } from '@zextras/carbonio-design-system';

import { map } from 'lodash';
import { Crumb } from '../../../../types/commons';

type BreadcrumbsProps = Array<Crumb>;

export const Breadcrumbs: FC<{ breadcrumbs: BreadcrumbsProps }> = ({ breadcrumbs }) => (
	<>
		{map(breadcrumbs, (item, index: number) => {
			const { label, tooltip } = item;
			return tooltip === '' ? (
				<Text key={index} color="secondary">
					/&nbsp;{label}&nbsp;{index === breadcrumbs.length - 1 && '/'}
				</Text>
			) : (
				<Tooltip label={tooltip} key={index} maxWidth={450}>
					<Text color="secondary">
						/&nbsp;{label}&nbsp;{index === breadcrumbs.length - 1 && '/'}
					</Text>
				</Tooltip>
			);
		})}
	</>
);
