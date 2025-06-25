/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { Container, ChipInput } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Controller } from 'react-hook-form';

import { FormValuesControlProps } from 'views/search/types/types';

export const SubjectKeywordRow = ({ control }: FormValuesControlProps): ReactElement => {
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
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={'keywordInput'}
					render={({ field: { onChange, value } }): React.JSX.Element => (
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
							requireUniqueChips
						/>
					)}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={'subjectInput'}
					render={({ field: { onChange, value } }): React.JSX.Element => (
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
	);
};
