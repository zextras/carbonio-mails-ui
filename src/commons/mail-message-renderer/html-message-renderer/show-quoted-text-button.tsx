/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Button, Row } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

type ShowQuotedTextButtonProps = {
	onShowQuotedText: () => void;
};

export const ShowQuotedTextButton = ({
	onShowQuotedText
}: ShowQuotedTextButtonProps): React.JSX.Element => (
	<Row mainAlignment="center" crossAlignment="center">
		<Button
			label={t('label.show_quoted_text', 'Show quoted text')}
			icon="EyeOutline"
			type="outlined"
			onClick={onShowQuotedText}
			width="fill"
		/>
	</Row>
);
