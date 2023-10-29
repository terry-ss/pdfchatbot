import os
from configparser import ConfigParser

from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI


from langchain.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)

config = ConfigParser()
config.read('config.ini')
os.environ['OPENAI_API_KEY']=config['OpenAI']['API_KEY']

class PDFBot:
    def __init__(self):
        self.model = config['OpenAI']['MODEL']
        self.temperature = float(config['OpenAI']['TEMPERATURE'])
        self.pdf_filename = None  # Store PDF filename
        self.rag_chain = None  # Store PDF content
        with open("prompt.txt", "r", encoding="utf-8") as f:
            template=f.read()
            self.prompt = ChatPromptTemplate(
                messages=[
                    SystemMessagePromptTemplate.from_template(template),
                    # The `variable_name` here is what must align with memory
                    MessagesPlaceholder(variable_name="chat_history"),
                    HumanMessagePromptTemplate.from_template("{question}")
                ]
            )
        self.llm = ChatOpenAI(model_name=self.model, temperature=self.temperature)
        self.conversation=None
        
    def prepare_pdf(self,filename):
        self.pdf_filename = filename
        loader=PyPDFLoader("uploads/" + filename)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size = 1000, chunk_overlap = 100)
        splits = text_splitter.split_documents(loader.load())
        embeddings = OpenAIEmbeddings()
        
        vectorstore = Chroma.from_documents(documents=splits,embedding=embeddings)
        self.retriever = vectorstore.as_retriever()
        self.memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
        self.conversation  = ConversationalRetrievalChain.from_llm(
            llm = self.llm,
            retriever = self.retriever,
            memory = self.memory
        )

    def generate_response(self, user_message):

        try:
            #raise RuntimeError("for testing")
            bot_response=self.conversation({"question": user_message})
            bot_response=bot_response['answer']
        except Exception as E:
            bot_response="エラー発生"
            print(E)
        return bot_response

    def clear_messages(self):
        if self.conversation:
            self.memory.clear()

    def clear_pdf_info(self):
        self.pdf_filename = None
        self.clear_messages()


if __name__ == "__main__":
    bot = PDFBot()
    bot.prepare_pdf("example.pdf")
    res=bot.generate_response("まとめて")
    print(res)
    res=bot.generate_response("従来の問題解決方法は")
    print(res)

    