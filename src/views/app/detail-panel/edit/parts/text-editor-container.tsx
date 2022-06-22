/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import React, { FC, ReactElement, useContext } from 'react';
import { Row, Container, Text } from '@zextras/carbonio-design-system';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { EditViewContext } from './edit-view-context';
import * as StyledComp from './edit-view-styled-components';

type PropType = {
	onDragOverEvent: () => void;
	draftSavedAt: string;
};
const TextEditorContainer: FC<PropType> = ({ onDragOverEvent, draftSavedAt }) => {
	const { control, editor, throttledSaveToDraft, updateSubjectField } = useContext(EditViewContext);
	const [Composer, composerIsAvailable] = useIntegratedComponent('composer');
	const [t] = useTranslation();

	return (
		<>
			{editor?.text && (
				<Container
					height="fit"
					padding={{ all: 'small' }}
					background="gray6"
					crossAlignment="flex-end"
				>
					{editor?.richText && composerIsAvailable ? (
						<Controller
							height="fit"
							name="text"
							control={control}
							defaultValue={editor?.text}
							render={({ onChange, value }): ReactElement => (
								<Container background="gray6">
									<StyledComp.EditorWrapper>
										<Composer
											// eslint-disable-next-line @typescript-eslint/ban-ts-comment
											// @ts-ignore
											value={value[1]}
											onEditorChange={(ev: Array<string>): void => {
												updateSubjectField({ text: [ev[0], ev[1]] });
												throttledSaveToDraft({ text: [ev[0], ev[1]] });
												onChange([ev[0], ev[1]]);
											}}
											onDragOver={onDragOverEvent}
										/>
									</StyledComp.EditorWrapper>
								</Container>
							)}
						/>
					) : (
						<Controller
							name="text"
							control={control}
							defaultValue={editor?.text}
							render={({ onChange, value }): ReactElement => (
								<Container background="gray6" height="fit">
									<StyledComp.TextArea
										value={value[0]}
										onChange={(ev): void => {
											// eslint-disable-next-line no-param-reassign
											ev.target.style.height = 'auto';
											// eslint-disable-next-line no-param-reassign
											ev.target.style.height = `${25 + ev.target.scrollHeight}px`;
											const data = [
												ev.target.value,
												`${
													editor?.text[1] ? `${editor.text[1]}${ev.target.value}` : ev.target.value
												}`
											];

											throttledSaveToDraft({ text: data });
											updateSubjectField({ text: data });
											onChange(data);
										}}
									/>
								</Container>
							)}
						/>
					)}

					{draftSavedAt && (
						<StyledComp.StickyTime>
							<Row
								crossAlignment="flex-end"
								background="gray5"
								padding={{ vertical: 'medium', horizontal: 'large' }}
							>
								<Text size="extrasmall" color="secondary">
									{t('message.email_saved_at', {
										time: draftSavedAt,
										defaultValue: 'Email saved as draft at {{time}}'
									})}
								</Text>
							</Row>
						</StyledComp.StickyTime>
					)}
					<StyledComp.Divider />
				</Container>
			)}
		</>
	);
};

export default TextEditorContainer;
