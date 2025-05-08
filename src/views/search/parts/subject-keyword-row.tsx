/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import { Container, ChipInput } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Controller } from 'react-hook-form';

import type { SubjectKeywordRowProps } from '../../../types';

const SubjectKeywordRow: FC<SubjectKeywordRowProps> = ({
	control,
	subjectInputName,
	keywordsInputName
}): ReactElement => {
	const keywordChipOnAdd = useCallback(
		(label: unknown) => ({
			label: label as string,
			hasAvatar: false,
			isGeneric: true
		}),
		[]
	);
	const chipOnAdd = useCallback(
		(
			label: string,
			preText: string,
			hasAvatar: boolean,
			isGeneric: boolean,
			isQueryFilter: boolean
		) => ({
			label: `${preText}:${label}`,
			hasAvatar,
			isGeneric,
			isQueryFilter,
			value: `${preText}:${label}`
		}),
		[]
	);

	const subjectChipOnAdd = useCallback(
		(label: unknown): any => chipOnAdd(label as string, 'Subject', false, false, true),
		[chipOnAdd]
	);

	const subjectPlaceholder = t('label.subject', 'Subject');

	return (
		<React.Fragment>
			<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
				<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
					<Controller
						control={control}
						name={keywordsInputName}
						render={({ field: { onChange, value } }) => (
							<ChipInput
								placeholder={t('label.keywords', 'Keywords')}
								data-testid={'keywords-input'}
								background="gray5"
								value={value}
								separators={[
									{ key: 'Enter', ctrlKey: false },
									{ key: ',', ctrlKey: false }
								]}
								onChange={onChange}
								onAdd={keywordChipOnAdd}
							/>
						)}
					/>
				</Container>
				<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
					<Controller
						control={control}
						name={subjectInputName}
						render={({ field: { onChange, value } }) => (
							<ChipInput
								placeholder={subjectPlaceholder}
								data-testid={'subject-input'}
								background="gray5"
								value={value}
								separators={[
									{ key: 'Enter', ctrlKey: false },
									{ key: ',', ctrlKey: false }
								]}
								onChange={onChange}
								onAdd={subjectChipOnAdd}
								maxChips={1}
							/>
						)}
					/>
				</Container>
			</Container>
		</React.Fragment>
	);
};

export default SubjectKeywordRow;
