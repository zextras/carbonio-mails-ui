/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Container, ChipInput } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, includes, map } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form';

import type { SubjectKeywordRowProps } from '../../../types';

const SubjectKeywordRow: FC<SubjectKeywordRowProps> = ({
	query,
	subjectInputName,
	keywordsInputName
}): ReactElement => {
	const { control } = useFormContext();
	const queryArray = useMemo(() => ['has:attachment', 'is:flagged', 'is:unread'], []);
	const otherKeywords = map(
		filter(
			query,
			(v) =>
				!includes(queryArray, v.label) &&
				!/^Subject:/.test(v.label) &&
				!/^Attachment:/.test(v.label) &&
				!/^Is:/.test(v.label) &&
				!/^Smaller:/.test(v.label) &&
				!/^Larger:/.test(v.label) &&
				!/^subject:/.test(v.label) &&
				!/^in:/.test(v.label) &&
				!/^before:/.test(v.label) &&
				!/^after:/.test(v.label) &&
				!/^date:/.test(v.label) &&
				!/^tag:/.test(v.label) &&
				!/^to:/.test(v.label) &&
				!/^from:/.test(v.label) &&
				!v.isQueryFilter
		),
		(q) => ({ ...q, hasAvatar: false })
	);

	const subjectsInQuery = map(
		filter(query, (v) => /^Subject:/.test(v.label)),
		(q) => ({ ...q, hasAvatar: false })
	);
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
						defaultValue={otherKeywords}
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
						defaultValue={subjectsInQuery}
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
