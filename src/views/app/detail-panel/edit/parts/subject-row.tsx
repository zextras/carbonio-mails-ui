/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useContext, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Container, Input, Padding, Tooltip, Icon } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import * as StyledComp from './edit-view-styled-components';
import { EditViewContext } from './edit-view-context';
import { EditViewContextType } from '../../../../../types';

type PropType = { updateSubjectField: ({ subject }: { subject: string }) => void };

const SubjectRow: FC<PropType> = ({ updateSubjectField }) => {
	const { control } = useForm();

	const { editor, throttledSaveToDraft } = useContext<EditViewContextType>(EditViewContext);

	const isIconsVisible = useMemo(
		() => editor?.requestReadReceipt || editor?.urgent,
		[editor?.requestReadReceipt, editor?.urgent]
	);
	return (
		<StyledComp.ColContainer occupyFull>
			<Controller
				name="subject"
				control={control}
				defaultValue={editor?.subject ?? ''}
				render={({ onChange, value }): ReactElement => (
					<Container
						orientation="horizontal"
						background="gray5"
						style={{ overflow: 'hidden' }}
						padding={{ all: 'none' }}
					>
						<Container background="gray5" style={{ overflow: 'hidden' }} padding="0">
							<Input
								data-testid="subject"
								onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => {
									updateSubjectField({ subject: ev.target.value });
									onChange(ev.target.value);
									throttledSaveToDraft({ subject: ev.target.value });
								}}
								label={t('label.subject', 'Subject')}
								value={value}
								backgroundColor="gray5"
								hideBorder
							/>
						</Container>
						{isIconsVisible && (
							<Container
								width="fit"
								background="gray5"
								padding={{ right: 'medium', left: 'extrasmall' }}
								orientation="horizontal"
							>
								{editor?.requestReadReceipt && (
									<Tooltip label={t('label.request_receipt', 'Request read receipt')}>
										<Padding right="small">
											<Icon icon="CheckmarkSquare" color="secondary" size="large" />
										</Padding>
									</Tooltip>
								)}
								{editor?.urgent && (
									<Tooltip label={t('tooltip.marked_as_important', 'Marked as important')}>
										<Icon icon="ArrowUpward" color="secondary" size="large" />
									</Tooltip>
								)}
							</Container>
						)}
					</Container>
				)}
			/>
		</StyledComp.ColContainer>
	);
};

export default SubjectRow;
