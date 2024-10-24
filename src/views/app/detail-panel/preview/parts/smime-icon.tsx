/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Icon, Row, Tooltip } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { MessageSignature } from '../../../../../types';
import { getSignedIconColor } from '../utils';

export const SmimeIcon = ({ signature }: { signature: MessageSignature }): React.JSX.Element => {
	const [t] = useTranslation();
	return (
		<Tooltip
			label={
				signature?.valid
					? t('label.valid_signature', 'Valid Signature')
					: t('label.invalid_signature', 'Invalid Signature')
			}
		>
			<Row>
				<Icon
					size="medium"
					icon={'SignatureOutline'}
					color={getSignedIconColor(signature?.messageCode ?? '')}
					style={{ alignSelf: 'center', paddingRight: '0.5rem' }}
					data-testid="smime-icon"
				/>
			</Row>
		</Tooltip>
	);
};
