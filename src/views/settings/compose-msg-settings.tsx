/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, useCallback, useMemo, useState } from 'react';

import {
	Container,
	FormSubSection,
	RadioGroup,
	Radio,
	FormSection,
	Switch,
	Text
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';

import { ColorPicker } from 'commons/color-picker';
import { UpdateSettingsProps } from 'types/settings';
import {
	getFontSizesOptions,
	findLabel,
	getFonts,
	prefToBool,
	boolToPref
} from 'views/settings/components/utils';
import CustomSelect from 'views/settings/filters/parts/custom-select';
import { composingMsgSubSection } from 'views/settings/subsections';

type ComposeMessagesProps = {
	settingsObj: Record<string, string>;
	updateSettings: (arg: UpdateSettingsProps) => void;
};

const ComposeMessage: FC<ComposeMessagesProps> = ({ settingsObj, updateSettings }) => {
	const [color, setColor] = useState(
		settingsObj?.zimbraPrefHtmlEditorDefaultFontColor ?? '#aabbcc'
	);

	const sectionTitle = useMemo(() => composingMsgSubSection(), []);
	const fontSizesOptions = useMemo(() => getFontSizesOptions(), []);
	const fontsOptions = useMemo(() => getFonts(), []);

	const fontSizesOptionsArray = map(fontSizesOptions, (value) => ({
		label: value,
		value
	}));

	const onColorChange = useCallback(
		(value: string) => {
			setColor(value);
			updateSettings({ target: { name: 'zimbraPrefHtmlEditorDefaultFontColor', value } });
		},
		[updateSettings]
	);

	const defaultSelectionFontSize = useMemo(
		() => ({
			label: settingsObj.zimbraPrefHtmlEditorDefaultFontSize,
			value: settingsObj.zimbraPrefHtmlEditorDefaultFontSize
		}),
		[settingsObj.zimbraPrefHtmlEditorDefaultFontSize]
	);

	const defaultSelectionFont = useMemo(
		() => ({
			label: findLabel(fontsOptions, settingsObj.zimbraPrefHtmlEditorDefaultFontFamily),
			value: settingsObj.zimbraPrefHtmlEditorDefaultFontFamily
		}),
		[fontsOptions, settingsObj.zimbraPrefHtmlEditorDefaultFontFamily]
	);
	const isDisabled = useMemo(
		() => settingsObj?.zimbraPrefComposeFormat === 'text',
		[settingsObj?.zimbraPrefComposeFormat]
	);
	return (
		<FormSection id={sectionTitle.id} label={sectionTitle.label}>
			<FormSubSection label={t('labels.compose', 'Compose')}>
				<Container crossAlignment="baseline" height="fit">
					<Container crossAlignment="flex-start" mainAlignment="flex-start">
						<Container crossAlignment="flex-start" mainAlignment="flex-start">
							<RadioGroup
								style={{ width: '100%' }}
								value={settingsObj?.zimbraPrefComposeFormat}
								onChange={(newValue): void => {
									updateSettings({
										target: { name: 'zimbraPrefComposeFormat', value: newValue as string }
									});
								}}
							>
								<Radio width="100%" label={t('label.as_text', 'As Text')} value="text" />
								<Radio width="100%" label={t('label.as_html', 'As HTML')} value="html" />
							</RadioGroup>
						</Container>
						<Container
							orientation="horizontal"
							crossAlignment="flex-start"
							mainAlignment="space-between"
							padding={{ left: 'medium' }}
							maxWidth="40vw"
						>
							<Container padding={{ right: 'small' }} minWidth="5.9375rem">
								<CustomSelect
									items={fontsOptions}
									background="gray5"
									disabled={isDisabled}
									label={t('settings.font', 'Font')}
									onChange={(value: string): void =>
										updateSettings({
											target: { name: 'zimbraPrefHtmlEditorDefaultFontFamily', value }
										})
									}
									defaultSelection={defaultSelectionFont}
								/>
							</Container>

							<Container padding={{ right: 'small' }} minWidth="6.25rem">
								<CustomSelect
									items={fontSizesOptionsArray}
									background="gray5"
									label={t('label.size', 'Size')}
									defaultSelection={defaultSelectionFontSize}
									disabled={isDisabled}
									onChange={(size: string): void =>
										updateSettings({
											target: { name: 'zimbraPrefHtmlEditorDefaultFontSize', value: size }
										})
									}
								/>
							</Container>
							<Container padding={{ right: 'small' }} crossAlignment="flex-start">
								<ColorPicker color={color} onChange={onColorChange} disabled={isDisabled} />
							</Container>
						</Container>
					</Container>
				</Container>
			</FormSubSection>
			<FormSubSection label={t('label.composing_messages_read_receipt', 'Read receipt')}>
				<Switch
					label={t('label.always_request_read_receipts', 'Always request read receipts')}
					value={prefToBool(settingsObj.zimbraPrefMailRequestReadReceipts)}
					onClick={(): void =>
						updateSettings({
							target: {
								name: 'zimbraPrefMailRequestReadReceipts',
								value: boolToPref(!prefToBool(settingsObj.zimbraPrefMailRequestReadReceipts))
							}
						})
					}
				/>
				<Text size="small">
					{t(
						'label.read_receipt_description',
						'Get notified when recipients open your emails. This applies to all messages unless changed manually.'
					)}
				</Text>
			</FormSubSection>
		</FormSection>
	);
};

export default ComposeMessage;
