/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';

import { FormSubSection } from '@zextras/carbonio-design-system';

import type { AccountIdentity, IdentityProps } from '../../../types';

type PersonalCertificatesSettingsPropsType = {
	updatedIdentities?: AccountIdentity[];
	updateIdentities?: (arg: {
		target?: {
			name: string;
			value: string;
		};
		_attrs?: IdentityProps;
	}) => void;
};

const PersonalCertificatesSettings: FC<PersonalCertificatesSettingsPropsType> = ({
	updatedIdentities,
	updateIdentities
}): ReactElement => (
	<>
		<FormSubSection
			label="Personal certificates for signing and encryption"
			id={''}
			padding={{ all: 'large' }}
		></FormSubSection>
	</>
);

export default PersonalCertificatesSettings;
