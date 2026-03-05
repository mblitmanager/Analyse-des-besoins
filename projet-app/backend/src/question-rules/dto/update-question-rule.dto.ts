import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionRuleDto } from './create-question-rule.dto';

export class UpdateQuestionRuleDto extends PartialType(CreateQuestionRuleDto) {}
