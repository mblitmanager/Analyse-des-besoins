export class CreateQuestionRuleDto {
  workflow: string;
  formation?: string;
  questionId?: number;
  operator?: string;
  expectedValue?: string;
  resultType: 'FORMATION_RECOMMENDATION' | 'CUSTOM_MESSAGE' | 'BLOCK';
  resultMessage?: string;
  isActive?: boolean;
  order?: number;
}
