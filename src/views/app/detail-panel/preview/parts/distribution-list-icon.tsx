/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Icon, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { IncompleteMessage } from '../../../../../types';

export const DistributionListIcon = ({
	isDistributionList
}: {
	isDistributionList: IncompleteMessage['isFromDistributionList'] | undefined;
}): React.JSX.Element => {
	const [t] = useTranslation();
	if (!isDistributionList) return <></>;
	return (
		<Tooltip label={t('label.distribution_list', 'Distribution List')}>
			<Row>
				<Icon
					size="medium"
					icon={'DistributionListOutline'}
					color="warning"
					style={{ paddingRight: '0.5rem' }}
					data-testid="distribution-list-icon"
				/>
			</Row>
		</Tooltip>
	);
};
