/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Row } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { useContactInput } from '../../../../../carbonio-ui-commons/integrations/hooks';
import { ContactInputItem } from '../../../../../carbonio-ui-commons/integrations/types';

type RedirectToProps = {
	defaultValue: any;
	onChange: (chip: ContactInputItem[]) => void;
};

export const RedirectTo = ({ defaultValue, onChange }: RedirectToProps): React.JSX.Element => {
	const ContactInput = useContactInput();
	const [t] = useTranslation();

	return (
		<Row padding={{ right: 'small' }} minWidth="22rem">
			<ContactInput
				data-testid={'filter-action-row-contact-input'}
				placeholder={t('settings.address', 'Address')}
				onChange={onChange}
				defaultValue={defaultValue}
				maxChips={1}
			/>
		</Row>
	);
};
